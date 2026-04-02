import { EntitySchema } from '@mikro-orm/core';
import { ClienteEntity } from '../../../clientes/infrastructure/persistence/cliente.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

export class EmpleadoEntity {
  id!: string;
  cliente!: ClienteEntity;
  estudio!: EstudioEntity;
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
  tableName: 'empleado',
  properties: {
    id: { type: 'uuid', primary: true },
    cliente: { kind: 'm:1', entity: () => ClienteEntity, fieldName: 'cliente_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
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
  uniques: [
    { properties: ['cuil', 'estudio'] },
  ],
  indexes: [
    { properties: ['estudio'] },
    { properties: ['cliente'] },
  ],
});
