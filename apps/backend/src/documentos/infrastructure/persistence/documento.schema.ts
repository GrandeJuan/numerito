import { EntitySchema } from '@mikro-orm/core';

export class DocumentoEntity {
  id!: string;
  clienteId!: string;
  tenantId!: string;
  tipo!: string;
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
  tableName: 'documentos',
  properties: {
    id: { type: 'uuid', primary: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id' },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    tipo: { type: 'string', length: 50 },
    nombre: { type: 'string' },
    s3Key: { type: 'string', fieldName: 's3_key' },
    mimeType: { type: 'string', fieldName: 'mime_type', length: 100 },
    sizeBytes: { type: 'integer', fieldName: 'size_bytes' },
    version: { type: 'integer', default: 1 },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['s3Key'], unique: true },
  ],
});
