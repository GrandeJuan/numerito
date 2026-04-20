import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface RechazarReglaPropuestaCommand {
  reglaId: string;
}

export class RechazarReglaPropuestaHandler {
  constructor(private readonly reglaRepo: ReglaVencimientoEntityRepository) {}

  async execute(command: RechazarReglaPropuestaCommand): Promise<{ id: string }> {
    const propuesta = await this.reglaRepo.findById(command.reglaId);
    if (!propuesta) throw new RecursoNoEncontradoError('ReglaVencimiento');

    propuesta.rechazar();
    await this.reglaRepo.save(propuesta);

    return { id: propuesta.id };
  }
}
