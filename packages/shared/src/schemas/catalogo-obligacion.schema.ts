import { z } from 'zod';
import { JURISDICCION } from '../constants/jurisdiccion';
import { FRECUENCIA_OBLIGACION } from '../constants/frecuencia-obligacion';

const jurisdiccionValues = Object.values(JURISDICCION) as [string, ...string[]];
const frecuenciaValues = Object.values(FRECUENCIA_OBLIGACION) as [string, ...string[]];

export const crearCatalogoObligacionSchema = z.object({
  nombre: z.string().min(1),
  jurisdiccion: z.enum(jurisdiccionValues),
  tipoObligacion: z.string().min(1),
  frecuencia: z.enum(frecuenciaValues),
  activo: z.boolean().optional().default(true),
});

export type CrearCatalogoObligacionInput = z.infer<typeof crearCatalogoObligacionSchema>;

export const actualizarCatalogoObligacionSchema = z.object({
  nombre: z.string().min(1).optional(),
  activo: z.boolean().optional(),
});

export type ActualizarCatalogoObligacionInput = z.infer<typeof actualizarCatalogoObligacionSchema>;
