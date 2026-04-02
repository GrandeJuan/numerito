import { EntitySchema } from '@mikro-orm/core';
import { PaisEntity } from './pais.schema';

export class ProvinciaEntity {
  id!: number;
  pais!: PaisEntity;
  nombre!: string;
}

export const ProvinciaSchema = new EntitySchema<ProvinciaEntity>({
  class: ProvinciaEntity,
  tableName: 'provincia',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    pais: { kind: 'm:1', entity: () => PaisEntity, fieldName: 'pais_id' },
    nombre: { type: 'string' },
  },
});
