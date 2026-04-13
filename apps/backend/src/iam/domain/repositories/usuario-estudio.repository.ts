import { BaseRepository } from '../../../shared/domain';
import { UsuarioEstudio } from '../entities/usuario-estudio.entity';

export interface UsuarioEstudioRepository extends BaseRepository<UsuarioEstudio> {
  findByUsuarioId(usuarioId: string): Promise<UsuarioEstudio[]>;
  findByUsuarioAndEstudio(usuarioId: string): Promise<UsuarioEstudio | null>;
}

export const USUARIO_ESTUDIO_REPOSITORY = Symbol('UsuarioEstudioRepository');
