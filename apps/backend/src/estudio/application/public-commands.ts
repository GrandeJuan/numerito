/**
 * Public write-operation barrel — the sanctioned cross-context entry point
 * for other contexts (e.g. administracion admin bridge) to invoke state
 * changes in estudio without reaching into /application/commands/ directly.
 */
export {
  CrearEstudioAdminHandler,
  type CrearEstudioAdminCommand,
  type CrearEstudioAdminResult,
} from './commands/crear-estudio-admin.command';
