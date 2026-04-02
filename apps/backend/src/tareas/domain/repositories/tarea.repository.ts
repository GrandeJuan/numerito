import { BaseRepository } from '../../../shared/domain';
import { Tarea } from '../entities/tarea.entity';

export interface TareaRepository extends BaseRepository<Tarea> {
  findByTenantId(tenantId: string): Promise<Tarea[]>;
  findByResponsableId(responsableId: string, tenantId: string): Promise<Tarea[]>;
}

export const TAREA_REPOSITORY = Symbol('TareaRepository');
