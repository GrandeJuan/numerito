import type { FeriadoRepository } from '../../domain/repositories/feriado.repository';
import { DiaFeriado } from '../../domain/entities/dia-feriado.entity';
import type { TipoFeriado, Jurisdiccion } from '@numerito/shared';

export interface CrearFeriadoCommand {
  fecha: string; // ISO date
  tipo: string;
  descripcion: string;
  jurisdiccionAfectada?: string | null;
}

export class CrearFeriadoHandler {
  constructor(private readonly repo: FeriadoRepository) {}

  async execute(command: CrearFeriadoCommand): Promise<{ id: string }> {
    const feriado = DiaFeriado.create({
      fecha: new Date(command.fecha),
      tipo: command.tipo as TipoFeriado,
      descripcion: command.descripcion,
      jurisdiccionAfectada: (command.jurisdiccionAfectada as Jurisdiccion) ?? null,
    });
    await this.repo.save(feriado);
    return { id: feriado.id };
  }
}
