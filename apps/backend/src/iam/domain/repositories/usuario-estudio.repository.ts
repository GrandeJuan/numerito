import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { UsuarioEstudio } from '../entities/usuario-estudio.entity';

export interface UsuarioEstudioRepository {
  findById(principal: EstudioPrincipal, id: string): Promise<UsuarioEstudio | null>;
  findAll(principal: EstudioPrincipal): Promise<UsuarioEstudio[]>;
  /**
   * Intentionally cross-tenant: discovers which estudios a user belongs to.
   * Called before a tenant context exists (e.g., estudio picker after login).
   * GlobalRepository escape — documented per ADR.
   */
  findByUsuarioId(usuarioId: string): Promise<UsuarioEstudio[]>;
  findByUsuarioAndEstudio(principal: EstudioPrincipal, usuarioId: string): Promise<UsuarioEstudio | null>;
  save(principal: EstudioPrincipal, membership: UsuarioEstudio): Promise<void>;
  delete(principal: EstudioPrincipal, membership: UsuarioEstudio): Promise<void>;
}

export const USUARIO_ESTUDIO_REPOSITORY = Symbol('UsuarioEstudioRepository');
