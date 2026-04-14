/**
 * Public events from the Obligaciones context.
 * Other contexts subscribe to these event names — never import Obligaciones internals.
 */
export const OBLIGACIONES_EVENTS = {
  VENCIMIENTO_CUMPLIDO: 'obligaciones.vencimiento-cumplido',
  VENCIMIENTO_VENCIDO: 'obligaciones.vencimiento-vencido',
} as const;

export interface VencimientoCumplidoPayload {
  vencimientoId: string;
  clienteId: string;
  tipoObligacion: string;
  periodo: string;
  occurredOn: Date;
}

export interface VencimientoVencidoPayload {
  vencimientoId: string;
  clienteId: string;
  tipoObligacion: string;
  periodo: string;
  occurredOn: Date;
}
