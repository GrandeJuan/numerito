import { z } from 'zod';

export const crearEmpleadoSchema = z.object({
  clienteId: z.string().min(1),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  cuil: z.string().min(1),
  fechaIngreso: z.string().datetime(),
  sueldoBasico: z.number().min(1),
  categoriaConvenio: z.string().min(1),
});

export type CrearEmpleadoInput = z.infer<typeof crearEmpleadoSchema>;

export const actualizarEmpleadoSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  categoriaConvenio: z.string().min(1).optional(),
});

export type ActualizarEmpleadoInput = z.infer<typeof actualizarEmpleadoSchema>;

export const actualizarSueldoSchema = z.object({
  sueldo: z.number().min(1),
});

export type ActualizarSueldoInput = z.infer<typeof actualizarSueldoSchema>;
