import type { Rol } from '@numerito/shared';
import type { Permiso } from '../value-objects/permiso.vo';

export interface RolPermisoRepository {
  findPermisosByRol(rol: Rol): Promise<Permiso[]>;
  asignarPermiso(rol: Rol, permiso: Permiso): Promise<void>;
  revocarPermiso(rol: Rol, permiso: Permiso): Promise<void>;
  tienePermiso(rol: Rol, permiso: Permiso): Promise<boolean>;
}

export const ROL_PERMISO_REPOSITORY = Symbol('RolPermisoRepository');
