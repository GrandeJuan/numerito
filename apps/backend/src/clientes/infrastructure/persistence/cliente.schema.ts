import { EntitySchema } from '@mikro-orm/core';

export class ClienteEntity {
  id!: string;
  cuit!: string;
  razonSocial!: string;
  condicionIva!: string;
  tipo!: string;
  regimen!: string;
  tenantId!: string;
  responsableId?: string;
  isActive!: boolean;
  provincias!: string[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const ClienteSchema = new EntitySchema<ClienteEntity>({
  class: ClienteEntity,
  tableName: 'clientes',
  properties: {
    id: { type: 'uuid', primary: true },
    cuit: { type: 'string', length: 13 },
    razonSocial: { type: 'string', fieldName: 'razon_social' },
    condicionIva: { type: 'string', fieldName: 'condicion_iva', length: 50 },
    tipo: { type: 'string', length: 50 },
    regimen: { type: 'string', length: 50 },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    responsableId: { type: 'uuid', fieldName: 'responsable_id', nullable: true },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    provincias: { type: 'json', default: '[]' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['cuit', 'tenantId'], unique: true },
    { properties: ['responsableId'] },
  ],
});
