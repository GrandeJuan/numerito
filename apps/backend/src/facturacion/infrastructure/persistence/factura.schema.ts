import { EntitySchema } from '@mikro-orm/core';

export class FacturaEntity {
  id!: string;
  clienteId!: string;
  tenantId!: string;
  numero!: string;
  fechaEmision!: Date;
  fechaVencimiento!: Date;
  subtotal!: number;
  iva!: number;
  total!: number;
  concepto!: string;
  estado!: string;
  totalPagado!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export const FacturaSchema = new EntitySchema<FacturaEntity>({
  class: FacturaEntity,
  tableName: 'facturas',
  properties: {
    id: { type: 'uuid', primary: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id' },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    numero: { type: 'string', length: 30 },
    fechaEmision: { type: 'Date', fieldName: 'fecha_emision' },
    fechaVencimiento: { type: 'Date', fieldName: 'fecha_vencimiento' },
    subtotal: { type: 'number', columnType: 'numeric(12,2)' },
    iva: { type: 'number', columnType: 'numeric(12,2)' },
    total: { type: 'number', columnType: 'numeric(12,2)' },
    concepto: { type: 'string' },
    estado: { type: 'string', length: 30, default: 'EMITIDA' },
    totalPagado: { type: 'number', fieldName: 'total_pagado', columnType: 'numeric(12,2)', default: 0 },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['numero', 'tenantId'], unique: true },
    { properties: ['tenantId', 'estado'] },
  ],
});
