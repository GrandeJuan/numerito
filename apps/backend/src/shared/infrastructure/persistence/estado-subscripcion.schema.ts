import { EntitySchema } from '@mikro-orm/core';

export class EstadoSubscripcionEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const EstadoSubscripcionSchema = new EntitySchema<EstadoSubscripcionEntity>({
  class: EstadoSubscripcionEntity,
  tableName: 'estado_subscripcion',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
