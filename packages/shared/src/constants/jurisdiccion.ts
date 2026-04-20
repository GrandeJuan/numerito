export const JURISDICCION = {
  ARCA: 'ARCA',
  ARBA: 'ARBA',
  AGIP: 'AGIP',
  COMISION_ARBITRAL: 'COMISION_ARBITRAL',
} as const;

export type Jurisdiccion = (typeof JURISDICCION)[keyof typeof JURISDICCION];
