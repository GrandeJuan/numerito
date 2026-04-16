import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { SesionRepository } from '../../domain/repositories/sesion.repository';
import { Sesion } from '../../domain/entities/sesion.entity';
import { SesionEntity } from './sesion.schema';
import { UsuarioEntity } from './usuario.schema';
import { SesionMapper } from './sesion.mapper';

@Injectable()
export class MikroOrmSesionRepository extends GlobalRepository<Sesion> implements SesionRepository {
  private readonly mapper = new SesionMapper();

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
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findByRefreshToken(refreshToken: string): Promise<Sesion | null> {
    const entity = await this.em.findOne(SesionEntity, { refreshToken }, { populate: ['usuario'] });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async save(sesion: Sesion): Promise<void> {
    const data = this.mapper.toPersistence(sesion);
    const existing = await this.em.findOne(SesionEntity, { id: data.id });
    if (existing) {
      existing.refreshToken = data.refreshToken;
      existing.isActive = data.isActive;
    } else {
      const usuario = await this.em.findOneOrFail(UsuarioEntity, { id: data.usuarioId });
      this.em.create(SesionEntity, {
        id: data.id,
        usuario,
        refreshToken: data.refreshToken,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        expiresAt: data.expiresAt,
        isActive: data.isActive,
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
}
