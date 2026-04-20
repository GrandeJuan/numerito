/**
 * Public views from the iam context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const USUARIO_SEARCH_VIEW = Symbol('USUARIO_SEARCH_VIEW');
export const USUARIOS_ADMIN_LIST_VIEW = Symbol('USUARIOS_ADMIN_LIST_VIEW');
export const USUARIO_ADMIN_KPIS_VIEW = Symbol('USUARIO_ADMIN_KPIS_VIEW');
export const USUARIO_MEMBERSHIP_VIEW = Symbol('USUARIO_MEMBERSHIP_VIEW');
export const ESTUDIO_EQUIPO_VIEW = Symbol('ESTUDIO_EQUIPO_VIEW');
export const USUARIO_COUNT_POR_ESTUDIO_VIEW = Symbol('USUARIO_COUNT_POR_ESTUDIO_VIEW');

export type { UsuarioSearchViewInput, UsuarioSearchResultDto } from './views/usuario-search.view';
export type { UsuariosAdminListViewInput, AdminUsuarioItemDto, UsuariosAdminListDto, UsuariosAdminStatsDto } from './views/usuarios-admin-list.view';
export type { UsuarioAdminKpisViewInput, UsuarioAdminKpisDto } from './views/usuario-admin-kpis.view';
export type { UsuarioMembershipViewInput, UsuarioMembershipDto } from './views/usuario-membership.view';
export type { EstudioEquipoViewInput, EquipoMiembroDto } from './views/estudio-equipo.view';
export type { UsuarioCountPorEstudioViewInput, UsuarioCountPorEstudioDto } from './views/usuario-count-por-estudio.view';
