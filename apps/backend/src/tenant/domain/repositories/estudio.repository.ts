import { BaseRepository } from '../../../shared/domain';
import { Estudio } from '../entities/estudio.entity';

export interface EstudioRepository extends BaseRepository<Estudio> {
  findByCuit(cuit: string): Promise<Estudio | null>;
}

export const ESTUDIO_REPOSITORY = Symbol('EstudioRepository');
