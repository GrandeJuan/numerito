import { EntitySchema } from '@mikro-orm/core';

export class LibroContableEntity {
  id!: string;
  clienteId!: string;
  tenantId!: string;
  tipo!: string;
  periodo!: string;
  isRubricado!: boolean;
  numeroRubrica?: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const LibroContableSchema = new EntitySchema<LibroContableEntity>({
  class: LibroContableEntity,
  tableName: 'libros_contables',
  properties: {
    id: { type: 'uuid', primary: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id' },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    tipo: { type: 'string', length: 50 },
    periodo: { type: 'string', length: 7 },
    isRubricado: { type: 'boolean', fieldName: 'is_rubricado', default: false },
    numeroRubrica: { type: 'string', fieldName: 'numero_rubrica', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['clienteId', 'tipo', 'periodo'], unique: true },
  ],
});
