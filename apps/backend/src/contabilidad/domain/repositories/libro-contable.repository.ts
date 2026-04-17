import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { LibroContable } from '../entities/libro-contable.entity';

export interface LibroContableRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<LibroContable | null>;
  findAll(principal: EstudioPrincipal): Promise<LibroContable[]>;
  save(principal: EstudioPrincipal, entity: LibroContable): Promise<void>;
  delete(principal: EstudioPrincipal, entity: LibroContable): Promise<void>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<LibroContable[]>;
}

export const LIBRO_CONTABLE_REPOSITORY = Symbol('LibroContableRepository');
