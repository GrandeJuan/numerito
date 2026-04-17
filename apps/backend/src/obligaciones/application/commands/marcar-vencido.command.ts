import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
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

  async execute(principal: EstudioPrincipal, command: MarcarVencidoCommand) {
    const vencimiento = await this.vencimientoRepo.findById(principal, command.vencimientoId);
    if (!vencimiento) throw new RecursoNoEncontradoError('Vencimiento');

    vencimiento.marcarVencido();
    await this.vencimientoRepo.save(principal, vencimiento);

    this.eventBus.publishAll(vencimiento.getDomainEvents());
    vencimiento.clearDomainEvents();

    return vencimiento;
  }
}
