/**
 * Public views from the tareas context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const TAREAS_PENDIENTES_VIEW = Symbol('TAREAS_PENDIENTES_VIEW');
export const CARGA_TRABAJO_VIEW = Symbol('CARGA_TRABAJO_VIEW');
export const ACTIVIDAD_RECIENTE_TAREAS_VIEW = Symbol('ACTIVIDAD_RECIENTE_TAREAS_VIEW');

export type { TareasPendientesViewInput, TareasPendientesDto } from './views/tareas-pendientes.view';
export type { CargaTrabajoViewInput, CargaTrabajoItemDto } from './views/carga-trabajo.view';
export type { ActividadRecienteTareasViewInput, ActividadRecienteTareaDto } from './views/actividad-reciente-tareas.view';
