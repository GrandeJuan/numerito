import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { Rol } from '@numerito/shared';
import type { RolPermisoRepository } from '../../domain/repositories/rol-permiso.repository';
import { Permiso } from '../../domain/value-objects/permiso.vo';
import { RolPermisoEntity } from '../../../shared/infrastructure/persistence/rol-permiso.schema';
import { RolEntity } from '../../../shared/infrastructure/persistence/rol.schema';
import { PermisoEntity } from '../../../shared/infrastructure/persistence/permiso.schema';

@Injectable()
export class MikroOrmRolPermisoRepository implements RolPermisoRepository {
  constructor(private readonly em: EntityManager) {}

  async findPermisosByRol(rol: Rol): Promise<Permiso[]> {
    const entries = await this.em.find(
      RolPermisoEntity,
      { rol: { codigo: rol } },
      { populate: ['permiso'] },
    );
    return entries.map((e) => e.permiso.codigo as Permiso);
  }

  async asignarPermiso(rol: Rol, permiso: Permiso): Promise<void> {
    const rolEntity = await this.em.findOneOrFail(RolEntity, { codigo: rol });
    const permisoEntity = await this.em.findOneOrFail(PermisoEntity, { codigo: permiso });
    this.em.create(RolPermisoEntity, { rol: rolEntity, permiso: permisoEntity });
    await this.em.flush();
  }

  async revocarPermiso(rol: Rol, permiso: Permiso): Promise<void> {
    const entry = await this.em.findOne(RolPermisoEntity, {
      rol: { codigo: rol },
      permiso: { codigo: permiso },
    });
    if (entry) {
      this.em.remove(entry);
      await this.em.flush();
    }
  }

  async tienePermiso(rol: Rol, permiso: Permiso): Promise<boolean> {
    const count = await this.em.count(RolPermisoEntity, {
      rol: { codigo: rol },
      permiso: { codigo: permiso },
    });
    return count > 0;
  }
}
