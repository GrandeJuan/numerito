import { UsuarioEstudio } from '../entities/usuario-estudio.entity';

export interface UsuarioEstudioRepository {
  findByUsuarioId(usuarioId: string): Promise<UsuarioEstudio[]>;
  findByEstudioId(estudioId: string): Promise<UsuarioEstudio[]>;
  findByUsuarioAndEstudio(usuarioId: string, estudioId: string): Promise<UsuarioEstudio | null>;
  save(membership: UsuarioEstudio): Promise<void>;
  delete(membership: UsuarioEstudio): Promise<void>;
}

export const USUARIO_ESTUDIO_REPOSITORY = Symbol('UsuarioEstudioRepository');
