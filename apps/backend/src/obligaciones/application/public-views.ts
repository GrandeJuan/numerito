/**
 * Public views from the obligaciones context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const VENCIMIENTOS_PROXIMOS_VIEW = Symbol('VENCIMIENTOS_PROXIMOS_VIEW');

export type { VencimientosProximosViewInput, VencimientosProximosDto } from './views/vencimientos-proximos.view';
