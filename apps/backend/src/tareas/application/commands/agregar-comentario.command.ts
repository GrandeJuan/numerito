import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface AgregarComentarioCommand {
  tareaId: string;
  autorId: string;
  texto: string;
}

export class AgregarComentarioHandler {
  constructor(
    private readonly tareaRepo: TareaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: AgregarComentarioCommand) {
    const tarea = await this.tareaRepo.findById(command.tareaId);
    if (!tarea) throw new RecursoNoEncontradoError('Tarea');

    tarea.agregarComentario(command.autorId, command.texto);
    await this.tareaRepo.save(tarea);

    this.eventBus.publishAll(tarea.getDomainEvents());
    tarea.clearDomainEvents();

    return tarea;
  }
}
