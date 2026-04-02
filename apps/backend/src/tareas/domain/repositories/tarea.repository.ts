import { BaseRepository } from '../../../shared/domain';
import { Tarea } from '../entities/tarea.entity';

export interface TareaRepository extends BaseRepository<Tarea> {
  findByEstudioId(estudioId: string): Promise<Tarea[]>;
  findByResponsableId(responsableId: string, estudioId: string): Promise<Tarea[]>;
}

export const TAREA_REPOSITORY = Symbol('TareaRepository');
