import { z } from 'zod';
import { JURISDICCION } from '../constants/jurisdiccion';
import { ESTADO_REGLA } from '../constants/estado-regla';
import { ORIGEN_REGLA } from '../constants/origen-regla';

const jurisdiccionValues = Object.values(JURISDICCION) as [string, ...string[]];
const estadoReglaValues = Object.values(ESTADO_REGLA) as [string, ...string[]];
const origenReglaValues = Object.values(ORIGEN_REGLA) as [string, ...string[]];

export const crearReglaVencimientoSchema = z.object({
  tipoObligacion: z.string().min(1),
  jurisdiccion: z.enum(jurisdiccionValues),
  regimen: z.string().min(1),
  terminacionCuit: z.string().length(1),
  diaVencimiento: z.number().int().min(1).max(31),
  mesSiguiente: z.boolean(),
  vigenciaDesde: z.string().min(1),
  vigenciaHasta: z.string().nullable().optional(),
  origen: z.enum(origenReglaValues).optional().default('MANUAL'),
  estado: z.enum(estadoReglaValues).optional().default('ACTIVA'),
});

export type CrearReglaVencimientoInput = z.infer<typeof crearReglaVencimientoSchema>;

export const actualizarReglaVencimientoSchema = z.object({
  diaVencimiento: z.number().int().min(1).max(31).optional(),
  mesSiguiente: z.boolean().optional(),
  vigenciaHasta: z.string().nullable().optional(),
  estado: z.enum(estadoReglaValues).optional(),
});

export type ActualizarReglaVencimientoInput = z.infer<typeof actualizarReglaVencimientoSchema>;
