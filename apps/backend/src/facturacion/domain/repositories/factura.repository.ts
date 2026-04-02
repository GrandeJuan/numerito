import { BaseRepository } from '../../../shared/domain';
import { Factura } from '../entities/factura.entity';

export interface FacturaRepository extends BaseRepository<Factura> {
  findByClienteId(clienteId: string, tenantId: string): Promise<Factura[]>;
  findByTenantId(tenantId: string): Promise<Factura[]>;
}

export const FACTURA_REPOSITORY = Symbol('FacturaRepository');
