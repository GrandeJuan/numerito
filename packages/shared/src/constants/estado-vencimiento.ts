export const ESTADO_VENCIMIENTO = {
  PENDIENTE: 'PENDIENTE',
  PRESENTADO: 'PRESENTADO',
  VENCIDO: 'VENCIDO',
} as const;

export type EstadoVencimiento = (typeof ESTADO_VENCIMIENTO)[keyof typeof ESTADO_VENCIMIENTO];
