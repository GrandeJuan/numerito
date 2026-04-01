import { BaseRepository } from '../../../shared/domain';
import { Usuario } from '../entities/usuario.entity';
import { Email } from '../value-objects/email.vo';

export interface UsuarioRepository extends BaseRepository<Usuario> {
  findByEmail(email: Email): Promise<Usuario | null>;
}

export const USUARIO_REPOSITORY = Symbol('UsuarioRepository');
