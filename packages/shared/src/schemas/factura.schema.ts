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

export const registrarPagoSchema = z.object({
  monto: z.number().min(0.01),
  medioPagoId: z.number().int().min(1),
  referencia: z.string().optional(),
});

export type RegistrarPagoInput = z.infer<typeof registrarPagoSchema>;
