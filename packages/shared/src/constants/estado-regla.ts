export const ESTADO_REGLA = {
  ACTIVA: 'ACTIVA',
  PROPUESTA: 'PROPUESTA',
  RECHAZADA: 'RECHAZADA',
} as const;

export type EstadoRegla = (typeof ESTADO_REGLA)[keyof typeof ESTADO_REGLA];
