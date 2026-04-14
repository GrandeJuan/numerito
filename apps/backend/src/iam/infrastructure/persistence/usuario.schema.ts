import { EntitySchema } from '@mikro-orm/core';
import { RolEntity } from '../../../shared/infrastructure/persistence/rol.schema';

export class UsuarioEntity {
  id!: string;
  email!: string;
  passwordHash!: string;
  nombre!: string;
  apellido!: string;
  rol!: RolEntity;
  isActive!: boolean;
  emailVerified!: boolean;
  provider!: string | null;
  providerId!: string | null;
  themePreference!: string;
  avatarUrl!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export const UsuarioSchema = new EntitySchema<UsuarioEntity>({
  class: UsuarioEntity,
  tableName: 'usuario',
  properties: {
    id: { type: 'uuid', primary: true },
    email: { type: 'string', unique: true },
    passwordHash: { type: 'string', fieldName: 'password_hash' },
    nombre: { type: 'string' },
    apellido: { type: 'string' },
    rol: { kind: 'm:1', entity: () => RolEntity, fieldName: 'rol_id' },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    emailVerified: { type: 'boolean', fieldName: 'email_verified', default: false },
    provider: { type: 'string', nullable: true, default: null },
    providerId: { type: 'string', fieldName: 'provider_id', nullable: true, default: null },
    themePreference: { type: 'string', fieldName: 'theme_preference', default: 'light' },
    avatarUrl: { type: 'string', fieldName: 'avatar_url', nullable: true, default: null, length: 500 },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
});
