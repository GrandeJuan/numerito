import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import type { UsuarioEstudioRepository } from '../../domain/repositories/usuario-estudio.repository';
import type { RolPermisoRepository } from '../../domain/repositories/rol-permiso.repository';
import type { Permiso } from '../../domain/value-objects/permiso.vo';

export interface ObtenerPermisosUsuarioQuery {
  usuarioId: string;
  estudioId: string;
}

export class ObtenerPermisosUsuarioHandler {
  constructor(
    private readonly usuarioEstudioRepo: UsuarioEstudioRepository,
    private readonly rolPermisoRepo: RolPermisoRepository,
  ) {}

  async execute(query: ObtenerPermisosUsuarioQuery): Promise<Permiso[]> {
    // Construct a lookup principal from query params — this handler is called
    // from UsuarioController which operates outside a tenant HTTP context.
    const principal: EstudioPrincipal = {
      estudioId: query.estudioId,
      userId: query.usuarioId,
      roles: [],
    };

    const membership = await this.usuarioEstudioRepo.findByUsuarioAndEstudio(
      principal,
      query.usuarioId,
    );

    if (!membership || !membership.isActive) {
      return [];
    }

    return this.rolPermisoRepo.findPermisosByRol(membership.rol);
  }
}
