import { Vencimiento } from '../../domain/entities/vencimiento.entity';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { TenantContext } from '../../../shared/domain/tenant-context';
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
    private readonly context: TenantContext,
  ) {}

  async execute(command: CrearVencimientoCommand): Promise<{ id: string }> {
    const estudioId = this.context.estudioId;
    if (!estudioId) {
      throw new Error('Tenant context not available');
    }

    const vencimiento = Vencimiento.create({
      clienteId: command.clienteId,
      estudioId,
      tipoObligacion: command.tipoObligacion as TipoObligacion,
      periodo: command.periodo,
      fechaVencimiento: new Date(command.fechaVencimiento),
      descripcion: command.descripcion,
    });

    await this.vencimientoRepo.save(vencimiento);
    return { id: vencimiento.id };
  }
}
