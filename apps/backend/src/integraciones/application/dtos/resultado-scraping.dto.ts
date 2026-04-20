import { z } from 'zod';

export const reglaPropuestaScrapeadaDtoSchema = z.object({
  tipoObligacion: z.string().min(1),
  jurisdiccion: z.string().min(1),
  regimen: z.string().min(1),
  terminacionCuit: z.string().length(1),
  diaVencimiento: z.number().int().min(1).max(31),
  mesSiguiente: z.boolean(),
  vigenciaDesde: z.string().min(1), // ISO date
  vigenciaHasta: z.string().nullable().optional(),
});

export const feriadoPropuestoDtoSchema = z.object({
  fecha: z.string().min(1), // ISO date (YYYY-MM-DD)
  tipo: z.enum(['NACIONAL', 'BANCARIO', 'PROVINCIAL', 'MUNICIPAL']),
  descripcion: z.string().min(1),
  jurisdiccionAfectada: z.string().nullable().optional(),
});

export const resultadoScrapingDtoSchema = z.object({
  fuente: z.enum(['ARCA', 'ARBA', 'AGIP', 'BCRA_FERIADOS']),
  ejecutadoEn: z.string().min(1),
  ingestaId: z.string().min(1).optional(),
  reglas: z.array(reglaPropuestaScrapeadaDtoSchema).default([]),
  feriados: z.array(feriadoPropuestoDtoSchema).default([]),
  errores: z.array(z.string()).default([]),
});

export type ResultadoScrapingDto = z.infer<typeof resultadoScrapingDtoSchema>;
export type ReglaPropuestaScrapeadaDto = z.infer<typeof reglaPropuestaScrapeadaDtoSchema>;
export type FeriadoPropuestoDto = z.infer<typeof feriadoPropuestoDtoSchema>;
