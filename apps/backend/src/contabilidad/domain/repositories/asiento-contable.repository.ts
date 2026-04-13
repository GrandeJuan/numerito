import { BaseRepository } from '../../../shared/domain';
import { AsientoContable } from '../entities/asiento-contable.entity';

export interface AsientoContableRepository extends BaseRepository<AsientoContable> {
  findByLibroId(libroId: string): Promise<AsientoContable[]>;
  findByClienteId(clienteId: string): Promise<AsientoContable[]>;
}

export const ASIENTO_CONTABLE_REPOSITORY = Symbol('AsientoContableRepository');
