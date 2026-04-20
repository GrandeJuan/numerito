import type { ReglaVencimientoEntityRepository } from '../../domain/repositories/regla-vencimiento.repository';
import { RecursoNoEncontradoError } from '../../../shared/domain/exceptions';

export interface ActualizarReglaVencimientoCommand {
  id: string;
  diaVencimiento?: number;
  mesSiguiente?: boolean;
  vigenciaHasta?: string | null;
  estado?: string;
}

export class ActualizarReglaVencimientoHandler {
  constructor(private readonly reglaRepo: ReglaVencimientoEntityRepository) {}

  async execute(command: ActualizarReglaVencimientoCommand): Promise<{ id: string }> {
    const regla = await this.reglaRepo.findById(command.id);
    if (!regla) throw new RecursoNoEncontradoError('ReglaVencimiento');

    if (command.estado === 'ACTIVA' && regla.estado !== 'ACTIVA') {
      regla.aprobar();
    } else if (command.estado === 'RECHAZADA' && regla.estado !== 'RECHAZADA') {
      regla.rechazar();
    }

    if (command.vigenciaHasta !== undefined) {
      regla.cerrarVigencia(
        command.vigenciaHasta ? new Date(command.vigenciaHasta) : new Date('9999-12-31'),
      );
    }

    await this.reglaRepo.save(regla);
    return { id: regla.id };
  }
}
