/**
 * Public events from the Obligaciones context.
 * Other contexts subscribe to these event names — never import Obligaciones internals.
 */
export const OBLIGACIONES_EVENTS = {
  VENCIMIENTO_CUMPLIDO: 'obligaciones.vencimiento-cumplido',
  VENCIMIENTO_VENCIDO: 'obligaciones.vencimiento-vencido',
  VENCIMIENTO_PROYECTADO: 'obligaciones.vencimiento-proyectado',
  VENCIMIENTO_PRORROGADO: 'obligaciones.vencimiento-prorrogado',
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

export interface VencimientoProyectadoPayload {
  vencimientoId: string;
  clienteId: string;
  tipoObligacion: string;
  periodo: string;
  estudioId: string;
  occurredOn: Date;
}

export interface VencimientoProrrogadoPayload {
  vencimientoId: string;
  clienteId: string;
  tipoObligacion: string;
  periodo: string;
  motivo: string;
  nuevaFecha: Date;
  occurredOn: Date;
}
