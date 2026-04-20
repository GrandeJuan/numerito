import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { VencimientoRepository } from '../../domain/repositories/vencimiento.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ProrrogarVencimientoCommand {
  vencimientoId: string;
  motivo: string;
  nuevaFecha: string;
}

export class ProrrogarVencimientoHandler {
  constructor(
    private readonly vencimientoRepo: VencimientoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(principal: EstudioPrincipal, command: ProrrogarVencimientoCommand) {
    const vencimiento = await this.vencimientoRepo.findById(principal, command.vencimientoId);
    if (!vencimiento) throw new RecursoNoEncontradoError('Vencimiento');

    vencimiento.prorrogar(command.motivo, new Date(command.nuevaFecha));
    await this.vencimientoRepo.save(principal, vencimiento);

    this.eventBus.publishAll(vencimiento.getDomainEvents());
    vencimiento.clearDomainEvents();

    return vencimiento;
  }
}
