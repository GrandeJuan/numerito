import { EntitySchema } from '@mikro-orm/core';

export class RegimenEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const RegimenSchema = new EntitySchema<RegimenEntity>({
  class: RegimenEntity,
  tableName: 'regimen',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
