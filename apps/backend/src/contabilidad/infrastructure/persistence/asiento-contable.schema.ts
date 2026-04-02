import { EntitySchema } from '@mikro-orm/core';
import { LibroContableEntity } from './libro-contable.schema';

export interface LineaAsientoDto {
  cuentaId: string;
  debe: number;
  haber: number;
  descripcion: string;
}

export class AsientoContableEntity {
  id!: string;
  libro!: LibroContableEntity;
  clienteId!: string;
  tenantId!: string;
  fecha!: Date;
  descripcion!: string;
  lineas!: LineaAsientoDto[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const AsientoContableSchema = new EntitySchema<AsientoContableEntity>({
  class: AsientoContableEntity,
  tableName: 'asientos_contables',
  properties: {
    id: { type: 'uuid', primary: true },
    libro: { kind: 'm:1', entity: () => LibroContableEntity, fieldName: 'libro_id' },
    clienteId: { type: 'uuid', fieldName: 'cliente_id' },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    fecha: { type: 'Date' },
    descripcion: { type: 'string' },
    lineas: { type: 'json' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['libro'] },
    { properties: ['fecha'] },
  ],
});
