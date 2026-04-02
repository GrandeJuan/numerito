import { EntitySchema } from '@mikro-orm/core';

export class EmpleadoEntity {
  id!: string;
  clienteId!: string;
  tenantId!: string;
  nombre!: string;
  apellido!: string;
  cuil!: string;
  fechaIngreso!: Date;
  fechaEgreso?: Date;
  sueldoBasico!: number;
  categoriaConvenio!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const EmpleadoSchema = new EntitySchema<EmpleadoEntity>({
  class: EmpleadoEntity,
  tableName: 'empleados',
  properties: {
    id: { type: 'uuid', primary: true },
    clienteId: { type: 'uuid', fieldName: 'cliente_id' },
    tenantId: { type: 'uuid', fieldName: 'tenant_id' },
    nombre: { type: 'string' },
    apellido: { type: 'string' },
    cuil: { type: 'string', length: 13 },
    fechaIngreso: { type: 'Date', fieldName: 'fecha_ingreso' },
    fechaEgreso: { type: 'Date', fieldName: 'fecha_egreso', nullable: true },
    sueldoBasico: { type: 'number', fieldName: 'sueldo_basico', columnType: 'numeric(12,2)' },
    categoriaConvenio: { type: 'string', fieldName: 'categoria_convenio' },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['tenantId'] },
    { properties: ['clienteId'] },
    { properties: ['cuil', 'tenantId'], unique: true },
  ],
});
