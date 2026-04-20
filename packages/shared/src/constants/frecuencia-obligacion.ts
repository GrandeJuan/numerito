export const FRECUENCIA_OBLIGACION = {
  MENSUAL: 'MENSUAL',
  ANUAL: 'ANUAL',
  QUINCENAL: 'QUINCENAL',
} as const;

export type FrecuenciaObligacion =
  (typeof FRECUENCIA_OBLIGACION)[keyof typeof FRECUENCIA_OBLIGACION];
