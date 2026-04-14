import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { SesionRepository } from '../../domain/repositories/sesion.repository';
import { Sesion } from '../../domain/entities/sesion.entity';
import { SesionEntity } from './sesion.schema';
import { UsuarioEntity } from './usuario.schema';

@Injectable()
export class MikroOrmSesionRepository extends GlobalRepository<Sesion> implements SesionRepository {
  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(_id: string): Promise<Sesion | null> {
    throw new Error('Not implemented');
  }

  async findAll(): Promise<Sesion[]> {
    throw new Error('Not implemented');
  }

  async delete(_entity: Sesion): Promise<void> {
    throw new Error('Not implemented');
  }

  async findByUsuarioId(usuarioId: string): Promise<Sesion[]> {
    const entities = await this.em.find(SesionEntity, { usuario: { id: usuarioId } });
    return entities.map((e) => this.toDomain(e));
  }

  async findByRefreshToken(refreshToken: string): Promise<Sesion | null> {
    const entity = await this.em.findOne(SesionEntity, { refreshToken }, { populate: ['usuario'] });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async save(sesion: Sesion): Promise<void> {
    const existing = await this.em.findOne(SesionEntity, { id: sesion.id });
    if (existing) {
      existing.refreshToken = sesion.refreshToken;
      existing.isActive = sesion.isActive;
    } else {
      const usuario = await this.em.findOneOrFail(UsuarioEntity, { id: sesion.usuarioId });
      this.em.create(SesionEntity, {
        id: sesion.id,
        usuario,
        refreshToken: sesion.refreshToken,
        ipAddress: sesion.ipAddress,
        userAgent: sesion.userAgent,
        expiresAt: sesion.expiresAt,
        isActive: sesion.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async revokeAllByUsuarioId(usuarioId: string): Promise<void> {
    const entities = await this.em.find(SesionEntity, {
      usuario: { id: usuarioId },
      isActive: true,
    });
    for (const entity of entities) {
      entity.isActive = false;
    }
    await this.em.flush();
  }

  private toDomain(entity: SesionEntity): Sesion {
    return Sesion.reconstitute(
      {
        usuarioId: entity.usuario.id,
        refreshToken: entity.refreshToken,
        ipAddress: entity.ipAddress,
        userAgent: entity.userAgent,
        expiresAt: entity.expiresAt,
        isActive: entity.isActive,
      },
      entity.id,
    );
  }
}
