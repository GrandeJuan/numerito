/**
 * Public views from the estudio context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const ESTUDIO_SEARCH_VIEW = Symbol('ESTUDIO_SEARCH_VIEW');
export const ESTUDIOS_ADMIN_LIST_VIEW = Symbol('ESTUDIOS_ADMIN_LIST_VIEW');

export type { EstudioSearchViewInput, EstudioSearchResultDto } from './views/estudio-search.view';
export type { EstudiosAdminListViewInput, AdminEstudioItemDto, EstudiosAdminListDto } from './views/estudios-admin-list.view';
