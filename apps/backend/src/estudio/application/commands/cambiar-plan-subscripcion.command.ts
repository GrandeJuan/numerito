import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface CambiarPlanSubscripcionCommand {
  planId: string;
}

export class CambiarPlanSubscripcionHandler {
  constructor(
    private readonly subscripcionRepo: SubscripcionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(principal: EstudioPrincipal, command: CambiarPlanSubscripcionCommand) {
    const subscripcion = await this.subscripcionRepo.findActiva(principal);
    if (!subscripcion) throw new RecursoNoEncontradoError('Subscripcion');

    subscripcion.cambiarPlan(command.planId);
    await this.subscripcionRepo.save(principal, subscripcion);

    this.eventBus.publishAll(subscripcion.getDomainEvents());
    subscripcion.clearDomainEvents();

    return subscripcion;
  }
}
