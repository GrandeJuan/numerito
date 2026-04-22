import type { FeriadoRepository } from '../../domain/repositories/feriado.repository';
import { DiaFeriado } from '../../domain/entities/dia-feriado.entity';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';
import type { TipoFeriado, Jurisdiccion } from '@numerito/shared';

export interface ActualizarFeriadoCommand {
  id: string;
  fecha?: string;
  tipo?: string;
  descripcion?: string;
  jurisdiccionAfectada?: string | null;
}

export class ActualizarFeriadoHandler {
  constructor(private readonly repo: FeriadoRepository) {}

  async execute(command: ActualizarFeriadoCommand): Promise<{ id: string }> {
    const existing = await this.repo.findById(command.id);
    if (!existing) throw new RecursoNoEncontradoError('DiaFeriado');

    // Reconstitute with updated values
    const updated = DiaFeriado.create(
      {
        fecha: command.fecha ? new Date(command.fecha) : existing.fecha,
        tipo: (command.tipo as TipoFeriado) ?? existing.tipo,
        descripcion: command.descripcion ?? existing.descripcion,
        jurisdiccionAfectada:
          command.jurisdiccionAfectada !== undefined
            ? (command.jurisdiccionAfectada as Jurisdiccion | null)
            : (existing.jurisdiccionAfectada as Jurisdiccion | null),
      },
      existing.id,
    );

    await this.repo.save(updated);
    return { id: updated.id };
  }
}
