import { EntitySchema } from '@mikro-orm/core';

export class PlanEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
  maxClientes!: number;
  maxUsuarios!: number;
  precio!: number;
}

export const PlanSchema = new EntitySchema<PlanEntity>({
  class: PlanEntity,
  tableName: 'plan',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
    maxClientes: { type: 'number', fieldName: 'max_clientes', columnType: 'int' },
    maxUsuarios: { type: 'number', fieldName: 'max_usuarios', columnType: 'int' },
    precio: { type: 'number', columnType: 'numeric(10,2)' },
  },
});
