import { z } from 'zod';
import { validarCuit } from './cuit.schema';

const CUIT_REGEX = /^\d{2}-?\d{8}-?\d$/;

export const crearClienteSchema = z.object({
  cuit: z
    .string()
    .regex(CUIT_REGEX, 'Formato de CUIT inválido')
    .refine(validarCuit, 'CUIT inválido — dígito verificador incorrecto'),
  razonSocial: z.string().min(3),
  condicionIva: z.string().min(1),
  tipo: z.string().min(1),
  regimen: z.string().min(1),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;

export const actualizarClienteSchema = z.object({
  razonSocial: z.string().min(3).optional(),
  condicionIva: z.string().min(1).optional(),
  regimen: z.string().min(1).optional(),
});

export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;

export const asignarResponsableSchema = z.object({
  responsableId: z.string().min(1),
});

export type AsignarResponsableInput = z.infer<typeof asignarResponsableSchema>;

export const inscripcionJurisdiccionSchema = z.object({
  jurisdiccion: z.string().min(1),
  regimen: z.string().min(1),
  activa: z.boolean(),
  desde: z.string().min(1),
});

export type InscripcionJurisdiccionInput = z.infer<typeof inscripcionJurisdiccionSchema>;

export const actualizarPerfilFiscalSchema = z.object({
  inscripciones: z.array(inscripcionJurisdiccionSchema).min(0),
});

export type ActualizarPerfilFiscalInput = z.infer<typeof actualizarPerfilFiscalSchema>;
