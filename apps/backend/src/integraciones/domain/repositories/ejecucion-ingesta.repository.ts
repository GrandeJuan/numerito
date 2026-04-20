import type { EjecucionIngesta } from '../entities/ejecucion-ingesta.entity';
import type { FuenteIngesta } from '../entities/configuracion-ingesta.entity';

export interface EjecucionIngestaRepository {
  findById(id: string): Promise<EjecucionIngesta | null>;
  findByIngestaId(ingestaId: string): Promise<EjecucionIngesta | null>;
  findByFuente(fuente: FuenteIngesta): Promise<EjecucionIngesta[]>;
  findAll(): Promise<EjecucionIngesta[]>;
  save(entity: EjecucionIngesta): Promise<void>;
}

export const EJECUCION_INGESTA_REPOSITORY = Symbol('EjecucionIngestaRepository');
