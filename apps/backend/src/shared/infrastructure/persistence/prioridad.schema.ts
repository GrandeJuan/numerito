import { EntitySchema } from '@mikro-orm/core';

export class PrioridadEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
  orden!: number;
}

export const PrioridadSchema = new EntitySchema<PrioridadEntity>({
  class: PrioridadEntity,
  tableName: 'prioridad',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
    orden: { type: 'number', columnType: 'int' },
  },
});
