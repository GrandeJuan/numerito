import { EntitySchema } from '@mikro-orm/core';
import { ProvinciaEntity } from './provincia.schema';

export class LocalidadEntity {
  id!: number;
  provincia!: ProvinciaEntity;
  nombre!: string;
}

export const LocalidadSchema = new EntitySchema<LocalidadEntity>({
  class: LocalidadEntity,
  tableName: 'localidad',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    provincia: { kind: 'm:1', entity: () => ProvinciaEntity, fieldName: 'provincia_id' },
    nombre: { type: 'string' },
  },
});
