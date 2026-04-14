import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface RenovarSubscripcionCommand {
  nuevaFechaFin: string;
}

export class RenovarSubscripcionHandler {
  constructor(
    private readonly subscripcionRepo: SubscripcionRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: RenovarSubscripcionCommand) {
    const subscripcion = await this.subscripcionRepo.findActiva();
    if (!subscripcion) throw new RecursoNoEncontradoError('Subscripcion');

    subscripcion.renovar(new Date(command.nuevaFechaFin));
    await this.subscripcionRepo.save(subscripcion);

    this.eventBus.publishAll(subscripcion.getDomainEvents());
    subscripcion.clearDomainEvents();

    return subscripcion;
  }
}
