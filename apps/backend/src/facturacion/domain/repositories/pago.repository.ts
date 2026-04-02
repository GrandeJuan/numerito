import { BaseRepository } from '../../../shared/domain';
import { Pago } from '../entities/pago.entity';

export interface PagoRepository extends BaseRepository<Pago> {
  findByFacturaId(facturaId: string): Promise<Pago[]>;
  findByEstudioId(estudioId: string): Promise<Pago[]>;
}

export const PAGO_REPOSITORY = Symbol('PagoRepository');
