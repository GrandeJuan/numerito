import type { EjecucionIngesta } from '../entities/ejecucion-ingesta.entity';
import type { FuenteIngesta } from '../entities/configuracion-ingesta.entity';

export interface EjecucionIngestaRepository {
  findById(id: string): Promise<EjecucionIngesta | null>;
  findByIngestaId(ingestaId: string): Promise<EjecucionIngesta | null>;
  findByFuente(fuente: FuenteIngesta): Promise<EjecucionIngesta[]>;
  /** Returns the single active (EN_CURSO) execution for a fuente, if any. */
  findEnCursoByFuente(fuente: FuenteIngesta): Promise<EjecucionIngesta | null>;
  findAll(): Promise<EjecucionIngesta[]>;
  save(entity: EjecucionIngesta): Promise<void>;
}

export const EJECUCION_INGESTA_REPOSITORY = Symbol('EjecucionIngestaRepository');
