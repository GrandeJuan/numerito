export const REGIMEN = {
  GENERAL: 'GENERAL',
  MONOTRIBUTO: 'MONOTRIBUTO',
} as const;

export type Regimen = (typeof REGIMEN)[keyof typeof REGIMEN];
