import { z } from 'zod';

export const proyectarCalendarioDtoSchema = z.object({
  clienteId: z.string().uuid(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de periodo inválido (YYYY-MM)'),
});

export type ProyectarCalendarioDto = z.infer<typeof proyectarCalendarioDtoSchema>;
