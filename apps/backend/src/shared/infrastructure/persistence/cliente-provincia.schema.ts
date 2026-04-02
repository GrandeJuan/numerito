import { EntitySchema } from '@mikro-orm/core';

// Forward-reference to avoid circular imports — ClienteEntity lives in clientes module
export class ClienteProvinciaEntity {
  clienteId!: string;
  provinciaId!: number;
}

export const ClienteProvinciaSchema = new EntitySchema<ClienteProvinciaEntity>({
  class: ClienteProvinciaEntity,
  tableName: 'cliente_provincia',
  properties: {
    clienteId: { type: 'uuid', fieldName: 'cliente_id', primary: true },
    provinciaId: { type: 'number', fieldName: 'provincia_id', primary: true },
  },
});
