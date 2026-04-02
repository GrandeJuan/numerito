import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { EstadoFacturaEntity } from '../../../shared/infrastructure/persistence/estado-factura.schema';

export class FacturaEntity {
  id!: string;
  cliente!: ClienteEntity;
  estudio!: EstudioEntity;
  numero!: string;
  fechaEmision!: Date;
  fechaVencimiento!: Date;
  subtotal!: number;
  iva!: number;
  total!: number;
  concepto!: string;
  estado!: EstadoFacturaEntity;
  totalPagado!: number;
  createdAt!: Date;
  updatedAt!: Date;
}

export const FacturaSchema = new EntitySchema<FacturaEntity>({
  class: FacturaEntity,
  tableName: 'factura',
  properties: {
    id: { type: 'uuid', primary: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    numero: { type: 'string', length: 30 },
    fechaEmision: { type: 'Date', fieldName: 'fecha_emision' },
    fechaVencimiento: { type: 'Date', fieldName: 'fecha_vencimiento' },
    subtotal: { type: 'number', columnType: 'numeric(12,2)' },
    iva: { type: 'number', columnType: 'numeric(12,2)' },
    total: { type: 'number', columnType: 'numeric(12,2)' },
    concepto: { type: 'string' },
    estado: { kind: 'm:1', entity: () => EstadoFacturaEntity, fieldName: 'estado_id' },
    totalPagado: { type: 'number', fieldName: 'total_pagado', columnType: 'numeric(12,2)', default: 0 },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  uniques: [
    { properties: ['numero', 'estudio'] },
  ],
  indexes: [
    { properties: ['estudio'] },
    { properties: ['cliente'] },
    { properties: ['estudio', 'estado'] },
  ],
});
