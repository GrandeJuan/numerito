export const PLAN = {
  FREE: 'FREE',
  PROFESIONAL: 'PROFESIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export type Plan = (typeof PLAN)[keyof typeof PLAN];
