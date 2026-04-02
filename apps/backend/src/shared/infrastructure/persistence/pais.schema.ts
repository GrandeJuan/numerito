import { EntitySchema } from '@mikro-orm/core';

export class PaisEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const PaisSchema = new EntitySchema<PaisEntity>({
  class: PaisEntity,
  tableName: 'pais',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', columnType: 'char(2)', unique: true },
    nombre: { type: 'string' },
  },
});
