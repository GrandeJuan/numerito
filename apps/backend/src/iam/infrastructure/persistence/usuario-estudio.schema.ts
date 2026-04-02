import { EntitySchema } from '@mikro-orm/core';
import { UsuarioEntity } from './usuario.schema';

export class UsuarioEstudioEntity {
  id!: string;
  usuario!: UsuarioEntity;
  estudioId!: string;
  rol!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const UsuarioEstudioSchema = new EntitySchema<UsuarioEstudioEntity>({
  class: UsuarioEstudioEntity,
  tableName: 'usuario_estudios',
  properties: {
    id: { type: 'uuid', primary: true },
    usuario: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'usuario_id' },
    estudioId: { type: 'uuid', fieldName: 'estudio_id' },
    rol: { type: 'string', length: 50 },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['usuario', 'estudioId'], unique: true },
    { properties: ['estudioId'] },
  ],
});
