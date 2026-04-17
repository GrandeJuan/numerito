import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { Tarea } from '../entities/tarea.entity';

export interface TareaRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<Tarea | null>;
  findAll(principal: EstudioPrincipal): Promise<Tarea[]>;
  save(principal: EstudioPrincipal, entity: Tarea): Promise<void>;
  delete(principal: EstudioPrincipal, entity: Tarea): Promise<void>;
  findByResponsableId(principal: EstudioPrincipal, responsableId: string): Promise<Tarea[]>;
}

export const TAREA_REPOSITORY = Symbol('TareaRepository');
