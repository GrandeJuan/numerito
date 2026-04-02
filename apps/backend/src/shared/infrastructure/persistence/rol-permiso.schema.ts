import { EntitySchema } from '@mikro-orm/core';
import { RolEntity } from './rol.schema';
import { PermisoEntity } from './permiso.schema';

export class RolPermisoEntity {
  rol!: RolEntity;
  permiso!: PermisoEntity;
}

export const RolPermisoSchema = new EntitySchema<RolPermisoEntity>({
  class: RolPermisoEntity,
  tableName: 'rol_permiso',
  properties: {
    rol: { kind: 'm:1', entity: () => RolEntity, fieldName: 'rol_id', primary: true },
    permiso: { kind: 'm:1', entity: () => PermisoEntity, fieldName: 'permiso_id', primary: true },
  },
});
