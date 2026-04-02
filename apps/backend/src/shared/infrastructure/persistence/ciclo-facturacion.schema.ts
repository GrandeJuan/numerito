import { EntitySchema } from '@mikro-orm/core';

export class CicloFacturacionEntity {
  id!: number;
  codigo!: string;
  nombre!: string;
}

export const CicloFacturacionSchema = new EntitySchema<CicloFacturacionEntity>({
  class: CicloFacturacionEntity,
  tableName: 'ciclo_facturacion',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    codigo: { type: 'string', unique: true },
    nombre: { type: 'string' },
  },
});
