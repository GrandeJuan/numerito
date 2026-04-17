import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Tarea } from '../../domain/entities/tarea.entity';
import type { TareaRepository } from '../../domain/repositories/tarea.repository';
import type { EventBus } from '../../../shared/domain/event-bus';
import type { Prioridad } from '@numerito/shared';

export interface CrearTareaCommand {
  titulo: string;
  descripcion?: string;
  clienteId?: string;
  prioridad: Prioridad;
}

export class CrearTareaHandler {
  constructor(
    private readonly tareaRepo: TareaRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(principal: EstudioPrincipal, command: CrearTareaCommand): Promise<Tarea> {
    const tarea = Tarea.create({
      titulo: command.titulo,
      descripcion: command.descripcion,
      clienteId: command.clienteId,
      prioridad: command.prioridad,
      estudioId: principal.estudioId,
    });

    await this.tareaRepo.save(principal, tarea);

    this.eventBus.publishAll(tarea.getDomainEvents());
    tarea.clearDomainEvents();

    return tarea;
  }
}
