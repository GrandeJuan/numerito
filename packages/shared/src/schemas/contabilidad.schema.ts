import { z } from 'zod';

export const lineaAsientoSchema = z.object({
  cuentaId: z.string().min(1),
  debe: z.number(),
  haber: z.number(),
  descripcion: z.string().min(1),
});

export type LineaAsientoInput = z.infer<typeof lineaAsientoSchema>;

export const crearAsientoSchema = z.object({
  libroId: z.string().min(1),
  clienteId: z.string().min(1),
  fecha: z.string().datetime(),
  descripcion: z.string().min(1),
  lineas: z.array(lineaAsientoSchema).min(1),
});

export type CrearAsientoInput = z.infer<typeof crearAsientoSchema>;

export const crearLibroSchema = z.object({
  clienteId: z.string().min(1),
  tipo: z.string().min(1),
  periodo: z.string().min(1),
});

export type CrearLibroInput = z.infer<typeof crearLibroSchema>;

export const rubricarLibroSchema = z.object({
  numeroRubrica: z.string().min(1),
});

export type RubricarLibroInput = z.infer<typeof rubricarLibroSchema>;
