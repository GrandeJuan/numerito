import { z } from 'zod';

export const prorrogarVencimientoDtoSchema = z.object({
  motivo: z.string().min(1, 'El motivo es obligatorio'),
  nuevaFecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
});

export type ProrrogarVencimientoDto = z.infer<typeof prorrogarVencimientoDtoSchema>;
