import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { ClienteRepository } from '../../../clientes/domain/repositories/cliente.repository';
import { ESTADO_VENCIMIENTO } from '@numerito/shared';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ReasignarResponsableCommand {
  clienteId: string;
  tipoObligacion: string;
  nuevoResponsableId: string;
}

export interface ReasignarResponsableResult {
  vencimientosActualizados: number;
}

export class ReasignarResponsableHandler {
  constructor(
    private readonly vencimientoRepo: VencimientoRepository,
    private readonly clienteRepo: ClienteRepository,
  ) {}

  async execute(
    principal: EstudioPrincipal,
    command: ReasignarResponsableCommand,
  ): Promise<ReasignarResponsableResult> {
    const cliente = await this.clienteRepo.findById(principal, command.clienteId);
    if (!cliente) throw new RecursoNoEncontradoError('Cliente');

    // Update the override on the client
    cliente.asignarResponsablePorObligacion(command.tipoObligacion, command.nuevoResponsableId);
    await this.clienteRepo.save(principal, cliente);

    // Reassign only future PENDIENTE vencimientos of this type for this client
    const vencimientos = await this.vencimientoRepo.findByClienteId(principal, command.clienteId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let actualizados = 0;
    for (const v of vencimientos) {
      if (v.tipoObligacion !== command.tipoObligacion) continue;
      if (v.estado !== ESTADO_VENCIMIENTO.PENDIENTE) continue;
      const fechaDay = new Date(v.fechaVencimiento);
      fechaDay.setHours(0, 0, 0, 0);
      if (fechaDay < today) continue;

      v.reasignarResponsable(command.nuevoResponsableId);
      await this.vencimientoRepo.save(principal, v);
      actualizados++;
    }

    return { vencimientosActualizados: actualizados };
  }
}
