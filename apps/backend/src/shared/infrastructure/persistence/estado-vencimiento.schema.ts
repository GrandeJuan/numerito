import { EntitySchema } from '@mikro-orm/core';

export class EstadoVencimientoEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const EstadoVencimientoSchema = new EntitySchema<EstadoVencimientoEntity>({
  class: EstadoVencimientoEntity,
  tableName: 'estado_vencimiento',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
