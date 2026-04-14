import { z } from 'zod';

export const lineaFacturaSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().min(1),
  precioUnitario: z.number().min(0),
  alicuotaIva: z.number().min(0),
});

export type LineaFacturaInput = z.infer<typeof lineaFacturaSchema>;

export const crearFacturaSchema = z.object({
  clienteId: z.string().min(1),
  numero: z.string().min(1),
  fechaEmision: z.string(), // ISO date string
  fechaVencimiento: z.string(), // ISO date string
  concepto: z.string().min(1),
  lineas: z.array(lineaFacturaSchema).min(1),
});

export type CrearFacturaInput = z.infer<typeof crearFacturaSchema>;
