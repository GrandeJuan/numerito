import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface MarcarSubscripcionVencidaCommand {
  subscripcionId: string;
}

export class MarcarSubscripcionVencidaHandler {
  constructor(
    private readonly subscripcionRepo: SubscripcionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(principal: EstudioPrincipal, command: MarcarSubscripcionVencidaCommand) {
    const subscripcion = await this.subscripcionRepo.findActiva(principal);
    if (!subscripcion) throw new RecursoNoEncontradoError('Subscripcion');

    subscripcion.marcarVencida();
    await this.subscripcionRepo.save(principal, subscripcion);

    this.eventBus.publishAll(subscripcion.getDomainEvents());
    subscripcion.clearDomainEvents();

    return subscripcion;
  }
}
