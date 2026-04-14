/**
 * Public events from the Estudio context.
 * Other contexts subscribe to these event names — never import Estudio internals.
 */
export const ESTUDIO_EVENTS = {
  SUBSCRIPCION_CREADA: 'estudio.subscripcion-creada',
  SUBSCRIPCION_RENOVADA: 'estudio.subscripcion-renovada',
  SUBSCRIPCION_CANCELADA: 'estudio.subscripcion-cancelada',
  SUBSCRIPCION_VENCIDA: 'estudio.subscripcion-vencida',
} as const;

export interface SubscripcionCreadaPayload {
  subscripcionId: string;
  estudioId: string;
  planId: string;
  occurredOn: Date;
}

export interface SubscripcionRenovadaPayload {
  subscripcionId: string;
  estudioId: string;
  nuevaFechaFin: Date;
  occurredOn: Date;
}

export interface SubscripcionCanceladaPayload {
  subscripcionId: string;
  estudioId: string;
  occurredOn: Date;
}

export interface SubscripcionVencidaPayload {
  subscripcionId: string;
  estudioId: string;
  occurredOn: Date;
}
