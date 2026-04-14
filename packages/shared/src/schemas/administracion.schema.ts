import { z } from 'zod';

export const crearPlanSchema = z.object({
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  maxClientes: z.number().int().positive(),
  maxUsuarios: z.number().int().positive(),
  precio: z.number(),
  isPublico: z.boolean().optional(),
  condiciones: z.record(z.unknown()).optional(),
});

export type CrearPlanInput = z.infer<typeof crearPlanSchema>;

export const actualizarPlanSchema = z.object({
  nombre: z.string().min(1).optional(),
  descripcion: z.string().optional(),
  maxClientes: z.number().int().positive().optional(),
  maxUsuarios: z.number().int().positive().optional(),
  precio: z.number().optional(),
  isPublico: z.boolean().optional(),
  condiciones: z.record(z.unknown()).optional(),
});

export type ActualizarPlanInput = z.infer<typeof actualizarPlanSchema>;
