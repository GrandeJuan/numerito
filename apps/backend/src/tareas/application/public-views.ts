/**
 * Public views from the tareas context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const TAREAS_PENDIENTES_VIEW = Symbol('TAREAS_PENDIENTES_VIEW');

export type { TareasPendientesViewInput, TareasPendientesDto } from './views/tareas-pendientes.view';
