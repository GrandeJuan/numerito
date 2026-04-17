import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { AsientoContable } from '../entities/asiento-contable.entity';

export interface AsientoContableRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<AsientoContable | null>;
  findAll(principal: EstudioPrincipal): Promise<AsientoContable[]>;
  save(principal: EstudioPrincipal, entity: AsientoContable): Promise<void>;
  delete(principal: EstudioPrincipal, entity: AsientoContable): Promise<void>;
  findByLibroId(principal: EstudioPrincipal, libroId: string): Promise<AsientoContable[]>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<AsientoContable[]>;
}

export const ASIENTO_CONTABLE_REPOSITORY = Symbol('AsientoContableRepository');
