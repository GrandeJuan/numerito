/**
 * Public views from the estudio context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const ESTUDIO_SEARCH_VIEW = Symbol('ESTUDIO_SEARCH_VIEW');
export const ESTUDIOS_ADMIN_LIST_VIEW = Symbol('ESTUDIOS_ADMIN_LIST_VIEW');
export const ESTUDIO_ADMIN_KPIS_VIEW = Symbol('ESTUDIO_ADMIN_KPIS_VIEW');
export const ESTUDIO_ADMIN_SPARKLINE_VIEW = Symbol('ESTUDIO_ADMIN_SPARKLINE_VIEW');
export const ESTUDIO_REGISTROS_MENSUALES_VIEW = Symbol('ESTUDIO_REGISTROS_MENSUALES_VIEW');
export const ESTUDIO_DISTRIBUCION_PLANES_VIEW = Symbol('ESTUDIO_DISTRIBUCION_PLANES_VIEW');
export const ESTUDIO_RECIENTES_ADMIN_VIEW = Symbol('ESTUDIO_RECIENTES_ADMIN_VIEW');

export type { EstudioSearchViewInput, EstudioSearchResultDto } from './views/estudio-search.view';
export type { EstudiosAdminListViewInput, AdminEstudioItemDto, EstudiosAdminListDto } from './views/estudios-admin-list.view';
export type { EstudioAdminKpisDto } from './views/estudio-admin-kpis.view';
export type { EstudioAdminSparklineViewInput, EstudioAdminSparklineDto } from './views/estudio-admin-sparkline.view';
export type { EstudioRegistrosMensualesViewInput, RegistroMensualDto } from './views/estudio-registros-mensuales.view';
export type { DistribucionPlanDto } from './views/estudio-distribucion-planes.view';
export type { EstudioRecientesAdminViewInput, EstudioRecienteAdminDto } from './views/estudio-recientes-admin.view';
