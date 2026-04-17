import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Pago } from '../entities/pago.entity';

export interface PagoRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Pago | null>;
  findAll(principal: EstudioPrincipal): Promise<Pago[]>;
  save(principal: EstudioPrincipal, entity: Pago): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Pago): Promise<void>;
  findByFacturaId(principal: EstudioPrincipal, facturaId: string): Promise<Pago[]>;
}

export const PAGO_REPOSITORY = Symbol('PagoRepository');
