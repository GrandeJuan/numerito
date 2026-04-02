import { EntitySchema } from '@mikro-orm/core';

export class UsuarioEntity {
  id!: string;
  email!: string;
  passwordHash!: string;
  nombre!: string;
  apellido!: string;
  rol!: string;
  isActive!: boolean;
  emailVerified!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const UsuarioSchema = new EntitySchema<UsuarioEntity>({
  class: UsuarioEntity,
  tableName: 'usuarios',
  properties: {
    id: { type: 'uuid', primary: true },
    email: { type: 'string', unique: true },
    passwordHash: { type: 'string', fieldName: 'password_hash' },
    nombre: { type: 'string' },
    apellido: { type: 'string' },
    rol: { type: 'string', length: 50 },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    emailVerified: { type: 'boolean', fieldName: 'email_verified', default: false },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
});
