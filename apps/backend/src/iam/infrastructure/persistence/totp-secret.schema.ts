import { EntitySchema } from '@mikro-orm/core';
import { UsuarioEntity } from './usuario.schema';

export class TotpSecretEntity {
  id!: string;
  usuario!: UsuarioEntity;
  secret!: string;
  verified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const TotpSecretSchema = new EntitySchema<TotpSecretEntity>({
  class: TotpSecretEntity,
  tableName: 'totp_secret',
  properties: {
    id: { type: 'uuid', primary: true },
    usuario: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'usuario_id' },
    secret: { type: 'string' },
    verified: { type: 'boolean', default: false },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['usuario'], options: { unique: true } },
  ],
});
