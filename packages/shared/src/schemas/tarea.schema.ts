import { z } from 'zod';
import { PRIORIDAD } from '../constants/prioridad';

const prioridadValues = Object.values(PRIORIDAD) as [string, ...string[]];

export const crearTareaSchema = z.object({
  titulo: z.string().min(1),
  descripcion: z.string().optional(),
  clienteId: z.string().optional(),
  prioridad: z.enum(prioridadValues),
});

export type CrearTareaInput = z.infer<typeof crearTareaSchema>;

export const asignarTareaSchema = z.object({
  responsableId: z.string().min(1),
});

export type AsignarTareaInput = z.infer<typeof asignarTareaSchema>;

export const registrarHorasSchema = z.object({
  horas: z.number().positive(),
  descripcion: z.string().min(1),
});

export type RegistrarHorasInput = z.infer<typeof registrarHorasSchema>;

export const agregarComentarioSchema = z.object({
  autorId: z.string().min(1),
  texto: z.string().min(1),
});

export type AgregarComentarioInput = z.infer<typeof agregarComentarioSchema>;
