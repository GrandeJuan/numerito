import { z } from 'zod';

export const configurarDiasAnticipacionDtoSchema = z.object({
  diasAnticipacion: z.number().int().min(1).nullable(),
});

export type ConfigurarDiasAnticipacionDto = z.infer<typeof configurarDiasAnticipacionDtoSchema>;
