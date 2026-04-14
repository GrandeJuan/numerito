import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface MarcarVencidoCommand {
  vencimientoId: string;
}

export class MarcarVencidoHandler {
  constructor(
    private readonly vencimientoRepo: VencimientoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: MarcarVencidoCommand) {
    const vencimiento = await this.vencimientoRepo.findById(command.vencimientoId);
    if (!vencimiento) throw new RecursoNoEncontradoError('Vencimiento');

    vencimiento.marcarVencido();
    await this.vencimientoRepo.save(vencimiento);

    this.eventBus.publishAll(vencimiento.getDomainEvents());
    vencimiento.clearDomainEvents();

    return vencimiento;
  }
}
