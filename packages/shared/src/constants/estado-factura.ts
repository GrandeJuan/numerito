export const ESTADO_FACTURA = {
  EMITIDA: 'EMITIDA',
  PARCIALMENTE_PAGADA: 'PARCIALMENTE_PAGADA',
  PAGADA: 'PAGADA',
  VENCIDA: 'VENCIDA',
  ANULADA: 'ANULADA',
} as const;

export type EstadoFactura = (typeof ESTADO_FACTURA)[keyof typeof ESTADO_FACTURA];

export const ESTADO_FACTURA_LABELS: Record<EstadoFactura, string> = {
  EMITIDA: 'Emitida',
  PARCIALMENTE_PAGADA: 'Parcial',
  PAGADA: 'Pagada',
  VENCIDA: 'Vencida',
  ANULADA: 'Anulada',
};
