export const TIPO_FERIADO = {
  NACIONAL: 'NACIONAL',
  BANCARIO: 'BANCARIO',
  PROVINCIAL: 'PROVINCIAL',
  MUNICIPAL: 'MUNICIPAL',
} as const;

export type TipoFeriado = (typeof TIPO_FERIADO)[keyof typeof TIPO_FERIADO];
