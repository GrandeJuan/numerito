import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface RegistrarHorasCommand {
  tareaId: string;
  horas: number;
}

export class RegistrarHorasHandler {
  constructor(
    private readonly tareaRepo: TareaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(principal: EstudioPrincipal, command: RegistrarHorasCommand) {
    const tarea = await this.tareaRepo.findById(principal, command.tareaId);
    if (!tarea) throw new RecursoNoEncontradoError('Tarea');

    tarea.registrarHoras(command.horas);
    await this.tareaRepo.save(principal, tarea);

    this.eventBus.publishAll(tarea.getDomainEvents());
    tarea.clearDomainEvents();

    return tarea;
  }
}
