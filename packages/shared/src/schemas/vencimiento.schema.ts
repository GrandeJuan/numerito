import { z } from 'zod';

export const crearVencimientoSchema = z.object({
  clienteId: z.string().min(1),
  tipoObligacion: z.string().min(1),
  periodo: z.string().min(1),
  fechaVencimiento: z.string(),
  descripcion: z.string().min(1),
});

export type CrearVencimientoInput = z.infer<typeof crearVencimientoSchema>;
