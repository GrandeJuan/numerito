import { EntitySchema } from '@mikro-orm/core';

export class PermisoEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
  modulo!: string;
}

export const PermisoSchema = new EntitySchema<PermisoEntity>({
  class: PermisoEntity,
  tableName: 'permiso',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
    modulo: { type: 'string' },
  },
});
