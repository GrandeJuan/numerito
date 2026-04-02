import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';
import type { ResetTokenRepository, ResetTokenData } from '../../domain/repositories/reset-token.repository';
import { ResetTokenEntity } from './reset-token.schema';
import { UsuarioEntity } from './usuario.schema';

@Injectable()
export class MikroOrmResetTokenRepository implements ResetTokenRepository {
  constructor(private readonly em: EntityManager) {}

  async save(data: ResetTokenData): Promise<void> {
    const usuario = await this.em.findOneOrFail(UsuarioEntity, { id: data.usuarioId });
    this.em.create(ResetTokenEntity, {
      id: randomUUID(),
      usuario,
      token: data.token,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    });
    await this.em.flush();
  }

  async findByToken(token: string): Promise<ResetTokenData | null> {
    const entity = await this.em.findOne(ResetTokenEntity, { token }, { populate: ['usuario'] });
    if (!entity) return null;
    return {
      usuarioId: entity.usuario.id,
      token: entity.token,
      expiresAt: entity.expiresAt,
    };
  }

  async deleteByUsuarioId(usuarioId: string): Promise<void> {
    const entities = await this.em.find(ResetTokenEntity, { usuario: { id: usuarioId } });
    for (const entity of entities) {
      this.em.remove(entity);
    }
    await this.em.flush();
  }
}
