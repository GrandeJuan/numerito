import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export class CancelarSubscripcionHandler {
  constructor(
    private readonly subscripcionRepo: SubscripcionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute() {
    const subscripcion = await this.subscripcionRepo.findActiva();
    if (!subscripcion) throw new RecursoNoEncontradoError('Subscripcion');

    subscripcion.cancelar();
    await this.subscripcionRepo.save(subscripcion);

    this.eventBus.publishAll(subscripcion.getDomainEvents());
    subscripcion.clearDomainEvents();

    return subscripcion;
  }
}
