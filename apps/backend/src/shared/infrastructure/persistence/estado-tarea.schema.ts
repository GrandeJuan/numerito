import { EntitySchema } from '@mikro-orm/core';

export class EstadoTareaEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const EstadoTareaSchema = new EntitySchema<EstadoTareaEntity>({
  class: EstadoTareaEntity,
  tableName: 'estado_tarea',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
