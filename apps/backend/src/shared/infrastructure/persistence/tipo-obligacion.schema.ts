import { EntitySchema } from '@mikro-orm/core';

export class TipoObligacionEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
  periodicidad!: string;
}

export const TipoObligacionSchema = new EntitySchema<TipoObligacionEntity>({
  class: TipoObligacionEntity,
  tableName: 'tipo_obligacion',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
    periodicidad: { type: 'string' },
  },
});
