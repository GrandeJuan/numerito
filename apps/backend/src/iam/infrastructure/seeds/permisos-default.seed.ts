import { ROL } from '@numerito/shared';
import type { Rol } from '@numerito/shared';
import { Permiso } from '../../domain/value-objects/permiso.vo';

/**
 * Default permissions per role, used to seed the database.
 * Once seeded, permissions are managed from the DB (configurable per estudio).
 */
export const PERMISOS_DEFAULT_SEED: Record<Rol, Permiso[]> = {
  [ROL.SUPERADMIN]: Object.values(Permiso),

  [ROL.SOCIO]: Object.values(Permiso),

  [ROL.RESPONSABLE]: [
    Permiso.VER_USUARIOS,
    Permiso.GESTIONAR_CLIENTES,
    Permiso.VER_CLIENTES,
    Permiso.GESTIONAR_OBLIGACIONES,
    Permiso.VER_OBLIGACIONES,
    Permiso.GESTIONAR_CONTABILIDAD,
    Permiso.VER_CONTABILIDAD,
    Permiso.GESTIONAR_NOMINA,
    Permiso.VER_NOMINA,
    Permiso.GESTIONAR_DOCUMENTOS,
    Permiso.VER_DOCUMENTOS,
    Permiso.GESTIONAR_TAREAS,
    Permiso.VER_TAREAS,
    Permiso.VER_FACTURACION,
  ],

  [ROL.EMPLEADO]: [
    Permiso.VER_CLIENTES,
    Permiso.VER_OBLIGACIONES,
    Permiso.VER_CONTABILIDAD,
    Permiso.VER_NOMINA,
    Permiso.VER_DOCUMENTOS,
    Permiso.VER_TAREAS,
  ],

  [ROL.CLIENTE]: [
    Permiso.VER_PROPIOS_DATOS,
    Permiso.VER_PROPIOS_DOCUMENTOS,
    Permiso.VER_PROPIOS_VENCIMIENTOS,
  ],
};
