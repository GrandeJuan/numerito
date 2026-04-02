import { EntitySchema } from '@mikro-orm/core';

export class EstadoFacturaEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const EstadoFacturaSchema = new EntitySchema<EstadoFacturaEntity>({
  class: EstadoFacturaEntity,
  tableName: 'estado_factura',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
