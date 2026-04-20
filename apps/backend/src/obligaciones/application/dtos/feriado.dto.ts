import { z } from 'zod';

export const crearFeriadoDtoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD'),
  tipo: z.enum(['NACIONAL', 'BANCARIO', 'PROVINCIAL', 'MUNICIPAL']),
  descripcion: z.string().min(1).max(200),
  jurisdiccionAfectada: z.string().nullable().optional(),
});

export const actualizarFeriadoDtoSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tipo: z.enum(['NACIONAL', 'BANCARIO', 'PROVINCIAL', 'MUNICIPAL']).optional(),
  descripcion: z.string().min(1).max(200).optional(),
  jurisdiccionAfectada: z.string().nullable().optional(),
});

export type CrearFeriadoDto = z.infer<typeof crearFeriadoDtoSchema>;
export type ActualizarFeriadoDto = z.infer<typeof actualizarFeriadoDtoSchema>;
