import { z } from 'zod';

export const marcarNoAplicaDtoSchema = z.object({
  motivo: z.string().min(1, 'El motivo es obligatorio'),
});

export type MarcarNoAplicaDto = z.infer<typeof marcarNoAplicaDtoSchema>;
