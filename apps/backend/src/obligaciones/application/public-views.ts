/**
 * Public views from the obligaciones context.
 * Read-model contexts consume these tokens and types — never import views/*.view.ts directly.
 */
export const VENCIMIENTOS_PROXIMOS_VIEW = Symbol('VENCIMIENTOS_PROXIMOS_VIEW');
export const VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW = Symbol('VENCIMIENTOS_PENDIENTES_CLIENTE_VIEW');
export const VENCIMIENTOS_POR_ESTADO_VIEW = Symbol('VENCIMIENTOS_POR_ESTADO_VIEW');
export const PROXIMOS_VENCIMIENTOS_DETALLE_VIEW = Symbol('PROXIMOS_VENCIMIENTOS_DETALLE_VIEW');
export const VENCIMIENTOS_RECIENTES_CLIENTE_VIEW = Symbol('VENCIMIENTOS_RECIENTES_CLIENTE_VIEW');
export const ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW = Symbol('ACTIVIDAD_RECIENTE_VENCIMIENTOS_VIEW');

export type { VencimientosProximosViewInput, VencimientosProximosDto } from './views/vencimientos-proximos.view';
export type { VencimientosPendientesClienteViewInput, VencimientosPendientesClienteDto } from './views/vencimientos-pendientes-cliente.view';
export type { VencimientosPorEstadoViewInput, VencimientoPorEstadoDto } from './views/vencimientos-por-estado.view';
export type { ProximosVencimientosDetalleViewInput, ProximoVencimientoDetalleDto } from './views/proximos-vencimientos-detalle.view';
export type { VencimientosRecientesClienteViewInput, VencimientoRecienteClienteDto } from './views/vencimientos-recientes-cliente.view';
export type { ActividadRecienteVencimientosViewInput, ActividadRecienteVencimientoDto } from './views/actividad-reciente-vencimientos.view';
