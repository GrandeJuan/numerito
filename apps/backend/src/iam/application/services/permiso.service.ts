import type { Rol } from '@numerito/shared';
import type { Permiso } from '../../domain/value-objects/permiso.vo';
import type { RolPermisoRepository } from '../../domain/repositories/rol-permiso.repository';

export class PermisoService {
  constructor(private readonly rolPermisoRepo: RolPermisoRepository) {}

  async tienePermiso(rol: Rol, permiso: Permiso): Promise<boolean> {
    return this.rolPermisoRepo.tienePermiso(rol, permiso);
  }

  async getPermisosByRol(rol: Rol): Promise<Permiso[]> {
    return this.rolPermisoRepo.findPermisosByRol(rol);
  }

  async asignarPermiso(rol: Rol, permiso: Permiso): Promise<void> {
    return this.rolPermisoRepo.asignarPermiso(rol, permiso);
  }

  async revocarPermiso(rol: Rol, permiso: Permiso): Promise<void> {
    return this.rolPermisoRepo.revocarPermiso(rol, permiso);
  }
}
