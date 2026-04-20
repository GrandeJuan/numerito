import { z } from 'zod';

export const actualizarConfiguracionIngestaDtoSchema = z.object({
  habilitado: z.boolean().optional(),
  cadenciaDias: z.number().int().min(1).optional(),
});

export type ActualizarConfiguracionIngestaDto = z.infer<typeof actualizarConfiguracionIngestaDtoSchema>;
