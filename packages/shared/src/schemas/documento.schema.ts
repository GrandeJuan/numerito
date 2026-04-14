import { z } from 'zod';
import { TIPO_DOCUMENTO } from '../constants/tipo-documento';

const tipoDocumentoValues = Object.values(TIPO_DOCUMENTO) as [string, ...string[]];

export const crearDocumentoSchema = z.object({
  clienteId: z.string().min(1),
  tipo: z.enum(tipoDocumentoValues),
  nombre: z.string().min(1),
  s3Key: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
});

export type CrearDocumentoInput = z.infer<typeof crearDocumentoSchema>;

export const nuevaVersionSchema = z.object({
  s3Key: z.string().min(1),
  sizeBytes: z.number().positive(),
});

export type NuevaVersionInput = z.infer<typeof nuevaVersionSchema>;
