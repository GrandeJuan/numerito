import { EntitySchema } from '@mikro-orm/core';
import { UsuarioEntity } from './usuario.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { RolEntity } from '../../../shared/infrastructure/persistence/rol.schema';

export class UsuarioEstudioEntity {
  id!: string;
  usuario!: UsuarioEntity;
  estudio!: EstudioEntity;
  rol!: RolEntity;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const UsuarioEstudioSchema = new EntitySchema<UsuarioEstudioEntity>({
  class: UsuarioEstudioEntity,
  tableName: 'usuario_estudio',
  properties: {
    id: { type: 'uuid', primary: true },
    usuario: { kind: 'm:1', entity: () => UsuarioEntity, fieldName: 'usuario_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    rol: { kind: 'm:1', entity: () => RolEntity, fieldName: 'rol_id' },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  uniques: [
    { properties: ['usuario', 'estudio'] },
  ],
  indexes: [
    { properties: ['estudio'] },
  ],
});
