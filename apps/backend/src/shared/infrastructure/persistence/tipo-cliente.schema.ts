import { EntitySchema } from '@mikro-orm/core';

export class TipoClienteEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const TipoClienteSchema = new EntitySchema<TipoClienteEntity>({
  class: TipoClienteEntity,
  tableName: 'tipo_cliente',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
