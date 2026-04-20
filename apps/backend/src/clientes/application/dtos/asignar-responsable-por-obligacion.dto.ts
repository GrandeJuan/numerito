import { z } from 'zod';

export const asignarResponsablePorObligacionDtoSchema = z.object({
  tipoObligacion: z.string().min(1),
  responsableId: z.string().min(1),
});

export type AsignarResponsablePorObligacionDto = z.infer<typeof asignarResponsablePorObligacionDtoSchema>;
