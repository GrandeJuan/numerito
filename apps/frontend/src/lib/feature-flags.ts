/**
 * Feature flags para el frontend.
 *
 * Se leen de variables NEXT_PUBLIC_* y quedan inlineadas en build time.
 * Para activar en dev, poner en .env.local:
 *    NEXT_PUBLIC_REDESIGN=true
 */

const flag = (name: string, fallback = false): boolean => {
  const v = process.env[name];
  if (v === undefined) return fallback;
  return v === 'true' || v === '1';
};

export const FEATURES = {
  /** Rediseño general (layout, primitivos, pantallas). Se activa por fases. */
  REDESIGN: flag('NEXT_PUBLIC_REDESIGN', false),
} as const;

export type FeatureName = keyof typeof FEATURES;

export const isFeatureOn = (name: FeatureName): boolean => FEATURES[name];
