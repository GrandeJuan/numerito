import { BaseRepository } from '../../../shared/domain';
import { Tarea } from '../entities/tarea.entity';

export interface TareaRepository extends BaseRepository<Tarea> {
  findByResponsableId(responsableId: string): Promise<Tarea[]>;
}

export const TAREA_REPOSITORY = Symbol('TareaRepository');
