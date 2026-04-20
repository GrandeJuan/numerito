import type { CatalogoObligacion } from '../entities/catalogo-obligacion.entity';
import type { Jurisdiccion } from '@numerito/shared';

export interface CatalogoObligacionRepository {
  findById(id: string): Promise<CatalogoObligacion | null>;
  findAll(): Promise<CatalogoObligacion[]>;
  findByJurisdiccion(jurisdiccion: Jurisdiccion): Promise<CatalogoObligacion[]>;
  findActivos(): Promise<CatalogoObligacion[]>;
  save(entity: CatalogoObligacion): Promise<void>;
  delete(entity: CatalogoObligacion): Promise<void>;
}

export const CATALOGO_OBLIGACION_REPOSITORY = Symbol('CatalogoObligacionRepository');
