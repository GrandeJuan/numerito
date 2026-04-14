import { crearDocumentoSchema, type CrearDocumentoInput } from '@numerito/shared';

export const crearDocumentoDtoSchema = crearDocumentoSchema;

export class CrearDocumentoDto implements CrearDocumentoInput {
  clienteId!: string;
  tipo!: string;
  nombre!: string;
  s3Key!: string;
  mimeType!: string;
  sizeBytes!: number;
}
