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
