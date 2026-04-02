import { EntitySchema } from '@mikro-orm/core';

export class MedioPagoEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const MedioPagoSchema = new EntitySchema<MedioPagoEntity>({
  class: MedioPagoEntity,
  tableName: 'medio_pago',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
