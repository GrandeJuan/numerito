import { EntitySchema } from '@mikro-orm/core';

export class CondicionIvaEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
  alicuota!: number;
}

export const CondicionIvaSchema = new EntitySchema<CondicionIvaEntity>({
  class: CondicionIvaEntity,
  tableName: 'condicion_iva',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
    alicuota: { type: 'number', columnType: 'numeric(5,2)' },
  },
});
