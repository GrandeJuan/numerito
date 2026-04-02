import { EntitySchema } from '@mikro-orm/core';

export class TipoLibroEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const TipoLibroSchema = new EntitySchema<TipoLibroEntity>({
  class: TipoLibroEntity,
  tableName: 'tipo_libro',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
