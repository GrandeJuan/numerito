import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface AsignarTareaCommand {
  tareaId: string;
  responsableId: string;
}

export class AsignarTareaHandler {
  constructor(
    private readonly tareaRepo: TareaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AsignarTareaCommand) {
    const tarea = await this.tareaRepo.findById(command.tareaId);
    if (!tarea) throw new RecursoNoEncontradoError('Tarea');

    tarea.asignar(command.responsableId);
    await this.tareaRepo.save(tarea);

    this.eventBus.publishAll(tarea.getDomainEvents());
    tarea.clearDomainEvents();

    return tarea;
  }
}
