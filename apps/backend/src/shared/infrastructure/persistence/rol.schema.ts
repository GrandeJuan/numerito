import { EntitySchema } from '@mikro-orm/core';

export class RolEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const RolSchema = new EntitySchema<RolEntity>({
  class: RolEntity,
  tableName: 'rol',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
