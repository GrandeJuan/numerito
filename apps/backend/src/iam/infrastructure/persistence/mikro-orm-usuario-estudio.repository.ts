import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { UsuarioEstudioRepository } from '../../domain/repositories/usuario-estudio.repository';
import { UsuarioEstudio } from '../../domain/entities/usuario-estudio.entity';
import { UsuarioEstudioEntity } from './usuario-estudio.schema';
import { UsuarioEntity } from './usuario.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';
import { RolEntity } from '../../../shared/infrastructure/persistence/rol.schema';
import type { Rol } from '@numerito/shared';

@Injectable()
export class MikroOrmUsuarioEstudioRepository implements UsuarioEstudioRepository {
  constructor(private readonly em: EntityManager) {}

  async findByUsuarioId(usuarioId: string): Promise<UsuarioEstudio[]> {
    const entities = await this.em.find(
      UsuarioEstudioEntity,
      { usuario: { id: usuarioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findByEstudioId(estudioId: string): Promise<UsuarioEstudio[]> {
    const entities = await this.em.find(
      UsuarioEstudioEntity,
      { estudio: { id: estudioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findByUsuarioAndEstudio(usuarioId: string, estudioId: string): Promise<UsuarioEstudio | null> {
    const entity = await this.em.findOne(
      UsuarioEstudioEntity,
      { usuario: { id: usuarioId }, estudio: { id: estudioId } },
      { populate: ['rol', 'usuario', 'estudio'] },
    );
    return entity ? this.toDomain(entity) : null;
  }

  async save(membership: UsuarioEstudio): Promise<void> {
    const existing = await this.em.findOne(UsuarioEstudioEntity, { id: membership.id });
    if (existing) {
      const rolEntity = await this.em.findOneOrFail(RolEntity, { codigo: membership.rol });
      existing.rol = rolEntity;
      existing.isActive = membership.isActive;
    } else {
      const usuario = await this.em.findOneOrFail(UsuarioEntity, { id: membership.usuarioId });
      const estudio = await this.em.findOneOrFail(EstudioEntity, { id: membership.estudioId });
      const rolEntity = await this.em.findOneOrFail(RolEntity, { codigo: membership.rol });
      this.em.create(UsuarioEstudioEntity, {
        id: membership.id,
        usuario,
        estudio,
        rol: rolEntity,
        isActive: membership.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(membership: UsuarioEstudio): Promise<void> {
    const entity = await this.em.findOne(UsuarioEstudioEntity, { id: membership.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: UsuarioEstudioEntity): UsuarioEstudio {
    return UsuarioEstudio.create(
      {
        usuarioId: entity.usuario.id,
        estudioId: entity.estudio.id,
        rol: entity.rol.codigo as Rol,
      },
      entity.id,
    );
  }
}
