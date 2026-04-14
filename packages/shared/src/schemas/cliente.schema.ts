import { z } from 'zod';

export const crearClienteSchema = z.object({
  cuit: z.string().min(1),
  razonSocial: z.string().min(3),
  condicionIva: z.string().min(1),
  tipo: z.string().min(1),
  regimen: z.string().min(1),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
