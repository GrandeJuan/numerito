import { EntitySchema } from '@mikro-orm/core';

export class EstudioEntity {
  id!: string;
  nombre!: string;
  plan!: string;
  maxClientes!: number;
  maxUsuarios!: number;
  cuit!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const EstudioSchema = new EntitySchema<EstudioEntity>({
  class: EstudioEntity,
  tableName: 'estudios',
  properties: {
    id: { type: 'uuid', primary: true },
    nombre: { type: 'string' },
    plan: { type: 'string', length: 50 },
    maxClientes: { type: 'integer', fieldName: 'max_clientes' },
    maxUsuarios: { type: 'integer', fieldName: 'max_usuarios' },
    cuit: { type: 'string', length: 13, unique: true },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
});
