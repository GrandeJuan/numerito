import type { Rol } from '@numerito/shared';
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
    const membership = await this.usuarioEstudioRepo.findByUsuarioAndEstudio(
      query.usuarioId,
      query.estudioId,
    );

    if (!membership || !membership.isActive) {
      return [];
    }

    return this.rolPermisoRepo.findPermisosByRol(membership.rol);
  }
}
