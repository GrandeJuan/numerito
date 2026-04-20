import { z } from 'zod';

export const reasignarResponsableDtoSchema = z.object({
  clienteId: z.string().uuid(),
  tipoObligacion: z.string().min(1),
  nuevoResponsableId: z.string().min(1),
});

export type ReasignarResponsableDto = z.infer<typeof reasignarResponsableDtoSchema>;
