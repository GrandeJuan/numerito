import { BaseRepository } from '../../../shared/domain';
import { LibroContable } from '../entities/libro-contable.entity';

export interface LibroContableRepository extends BaseRepository<LibroContable> {
  findByClienteId(clienteId: string): Promise<LibroContable[]>;
}

export const LIBRO_CONTABLE_REPOSITORY = Symbol('LibroContableRepository');
