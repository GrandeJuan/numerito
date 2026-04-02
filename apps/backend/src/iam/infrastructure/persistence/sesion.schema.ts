import { EntitySchema } from '@mikro-orm/core';
import { UsuarioEntity } from './usuario.schema';

export class SesionEntity {
  id!: string;
  usuario!: UsuarioEntity;
  refreshToken!: string;
  ipAddress!: string;
  userAgent!: string;
  expiresAt!: Date;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const SesionSchema = new EntitySchema<SesionEntity>({
  class: SesionEntity,
  tableName: 'sesiones',
  properties: {
    id: { type: 'uuid', primary: true },
    usuario: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'usuario_id' },
    refreshToken: { type: 'string', fieldName: 'refresh_token' },
    ipAddress: { type: 'string', fieldName: 'ip_address' },
    userAgent: { type: 'string', fieldName: 'user_agent' },
    expiresAt: { type: 'Date', fieldName: 'expires_at' },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['usuario'] },
  ],
});
