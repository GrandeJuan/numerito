import type { FeriadoRepository } from '../../domain/repositories/feriado.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface EliminarFeriadoCommand {
  id: string;
}

export class EliminarFeriadoHandler {
  constructor(private readonly repo: FeriadoRepository) {}

  async execute(command: EliminarFeriadoCommand): Promise<void> {
    const existing = await this.repo.findById(command.id);
    if (!existing) throw new RecursoNoEncontradoError('DiaFeriado');

    await this.repo.delete(existing);
  }
}
