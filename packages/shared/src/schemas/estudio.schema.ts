import { z } from 'zod';

export const actualizarEstudioSchema = z.object({
  nombre: z.string().min(3).optional(),
});

export type ActualizarEstudioInput = z.infer<typeof actualizarEstudioSchema>;

export const cambiarPlanSchema = z.object({
  planId: z.string().min(1),
});

export type CambiarPlanInput = z.infer<typeof cambiarPlanSchema>;

export const renovarSubscripcionSchema = z.object({
  nuevaFechaFin: z.string().datetime(),
});

export type RenovarSubscripcionInput = z.infer<typeof renovarSubscripcionSchema>;
