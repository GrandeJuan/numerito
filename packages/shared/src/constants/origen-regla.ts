export const ORIGEN_REGLA = {
  MANUAL: 'MANUAL',
  SCRAPING_OFICIAL: 'SCRAPING_OFICIAL',
  IMPORTACION: 'IMPORTACION',
} as const;

export type OrigenRegla = (typeof ORIGEN_REGLA)[keyof typeof ORIGEN_REGLA];
