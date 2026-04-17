import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Factura } from '../entities/factura.entity';

export interface FacturaRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Factura | null>;
  findAll(principal: EstudioPrincipal): Promise<Factura[]>;
  save(principal: EstudioPrincipal, entity: Factura): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Factura): Promise<void>;
  findByClienteId(principal: EstudioPrincipal, clienteId: string): Promise<Factura[]>;
}

export const FACTURA_REPOSITORY = Symbol('FacturaRepository');
