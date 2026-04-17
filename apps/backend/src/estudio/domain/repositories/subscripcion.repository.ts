import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Subscripcion } from '../entities/subscripcion.entity';

export interface SubscripcionRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Subscripcion | null>;
  findAll(principal: EstudioPrincipal): Promise<Subscripcion[]>;
  findActiva(principal: EstudioPrincipal): Promise<Subscripcion | null>;
  save(principal: EstudioPrincipal, entity: Subscripcion): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Subscripcion): Promise<void>;
}

export const SUBSCRIPCION_REPOSITORY = Symbol('SubscripcionRepository');
