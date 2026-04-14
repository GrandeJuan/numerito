import {
  crearDocumentoSchema,
  type CrearDocumentoInput,
  type TipoDocumento,
} from '@numerito/shared';

export const crearDocumentoDtoSchema = crearDocumentoSchema;

export class CrearDocumentoDto implements CrearDocumentoInput {
  clienteId!: string;
  tipo!: TipoDocumento;
  nombre!: string;
  s3Key!: string;
  mimeType!: string;
  sizeBytes!: number;
}
