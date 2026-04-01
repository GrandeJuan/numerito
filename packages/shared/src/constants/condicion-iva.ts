export const CONDICION_IVA = {
  RESPONSABLE_INSCRIPTO: 'RESPONSABLE_INSCRIPTO',
  MONOTRIBUTO: 'MONOTRIBUTO',
  EXENTO: 'EXENTO',
  NO_RESPONSABLE: 'NO_RESPONSABLE',
  CONSUMIDOR_FINAL: 'CONSUMIDOR_FINAL',
} as const;

export type CondicionIVA = (typeof CONDICION_IVA)[keyof typeof CONDICION_IVA];

export const CONDICION_IVA_LABELS: Record<CondicionIVA, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributista',
  EXENTO: 'Exento',
  NO_RESPONSABLE: 'No Responsable',
  CONSUMIDOR_FINAL: 'Consumidor Final',
};
