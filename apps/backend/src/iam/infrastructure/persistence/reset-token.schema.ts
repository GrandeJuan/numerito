import { EntitySchema } from '@mikro-orm/core';
import { UsuarioEntity } from './usuario.schema';

export class ResetTokenEntity {
  id!: string;
  usuario!: UsuarioEntity;
  token!: string;
  expiresAt!: Date;
  createdAt!: Date;
}

export const ResetTokenSchema = new EntitySchema<ResetTokenEntity>({
  class: ResetTokenEntity,
  tableName: 'reset_token',
  properties: {
    id: { type: 'uuid', primary: true },
    usuario: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'usuario_id' },
    token: { type: 'string', unique: true },
    expiresAt: { type: 'Date', fieldName: 'expires_at' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
  },
  indexes: [
    { properties: ['token'] },
    { properties: ['usuario'] },
  ],
});
