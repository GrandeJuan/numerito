import { EntitySchema } from '@mikro-orm/core';

export class VencimientoEntity {
  id!: string;
  clienteId!: string;
  tenantId!: string;
  tipoObligacion!: string;
  periodo!: string;
  fechaVencimiento!: Date;
  descripcion!: string;
  estado!: string;
  createdAt!: Date;
  updatedAt!: Date;
}

export const VencimientoSchema = new EntitySchema<VencimientoEntity>({
  class: VencimientoEntity,
  tableName: 'vencimientos',
  properties: {
    id: { type: 'uuid', primary: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id' },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    tipoObligacion: { type: 'string', fieldName: 'tipo_obligacion', length: 50 },
    periodo: { type: 'string', length: 7 },
    fechaVencimiento: { type: 'Date', fieldName: 'fecha_vencimiento' },
    descripcion: { type: 'string' },
    estado: { type: 'string', length: 20, default: 'PENDIENTE' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['fechaVencimiento'] },
    { properties: ['tenantId', 'estado'] },
  ],
});
