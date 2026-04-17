import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { TipoObligacion } from '@numerito/shared';

export interface CrearVencimientoCommand {
  clienteId: string;
  tipoObligacion: string;
  periodo: string;
  fechaVencimiento: string;
  descripcion: string;
}

export class CrearVencimientoHandler {
  constructor(
    private readonly vencimientoRepo: VencimientoRepository,
  ) {}

  async execute(principal: EstudioPrincipal, command: CrearVencimientoCommand): Promise<{ id: string }> {
    const vencimiento = Vencimiento.create({
      clienteId: command.clienteId,
      estudioId: principal.estudioId,
      tipoObligacion: command.tipoObligacion as TipoObligacion,
      periodo: command.periodo,
      fechaVencimiento: new Date(command.fechaVencimiento),
      descripcion: command.descripcion,
    });

    await this.vencimientoRepo.save(principal, vencimiento);
    return { id: vencimiento.id };
  }
}
