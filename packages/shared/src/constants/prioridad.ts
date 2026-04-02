export const PRIORIDAD = {
  BAJA: 'BAJA',
  MEDIA: 'MEDIA',
  ALTA: 'ALTA',
  URGENTE: 'URGENTE',
} as const;

export type Prioridad = (typeof PRIORIDAD)[keyof typeof PRIORIDAD];
