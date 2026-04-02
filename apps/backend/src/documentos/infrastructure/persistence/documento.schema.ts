import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { TipoDocumentoEntity } from '../../../shared/infrastructure/persistence/tipo-documento.schema';

export class DocumentoEntity {
  id!: string;
  cliente!: ClienteEntity;
  estudio!: EstudioEntity;
  tipoDocumento!: TipoDocumentoEntity;
  nombre!: string;
  s3Key!: string;
  mimeType!: string;
  sizeBytes!: number;
  version!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export const DocumentoSchema = new EntitySchema<DocumentoEntity>({
  class: DocumentoEntity,
  tableName: 'documento',
  properties: {
    id: { type: 'uuid', primary: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    tipoDocumento: { kind: 'm:1', entity: () => TipoDocumentoEntity, fieldName: 'tipo_documento_id' },
    nombre: { type: 'string' },
    s3Key: { type: 'string', fieldName: 's3_key', unique: true },
    mimeType: { type: 'string', fieldName: 'mime_type', length: 100 },
    sizeBytes: { type: 'integer', fieldName: 'size_bytes' },
    version: { type: 'integer', default: 1 },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['estudio'] },
    { properties: ['cliente'] },
  ],
});
