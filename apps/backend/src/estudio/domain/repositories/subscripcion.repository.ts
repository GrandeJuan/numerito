import { Subscripcion } from '../entities/subscripcion.entity';

export interface SubscripcionRepository {
  findAll(): Promise<Subscripcion[]>;
  findActiva(): Promise<Subscripcion | null>;
  save(entity: Subscripcion): Promise<void>;
  delete(entity: Subscripcion): Promise<void>;
}

export const SUBSCRIPCION_REPOSITORY = Symbol('SubscripcionRepository');
