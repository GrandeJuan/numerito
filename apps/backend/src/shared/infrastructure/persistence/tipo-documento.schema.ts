import { EntitySchema } from '@mikro-orm/core';

export class TipoDocumentoEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const TipoDocumentoSchema = new EntitySchema<TipoDocumentoEntity>({
  class: TipoDocumentoEntity,
  tableName: 'tipo_documento',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
