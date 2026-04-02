import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';
import type { TotpSecretRepository, TotpSecretData } from '../../domain/repositories/totp-secret.repository';
import { TotpSecretEntity } from './totp-secret.schema';
import { UsuarioEntity } from './usuario.schema';

@Injectable()
export class MikroOrmTotpSecretRepository implements TotpSecretRepository {
  constructor(private readonly em: EntityManager) {}

  async save(data: TotpSecretData): Promise<void> {
    const existing = await this.em.findOne(TotpSecretEntity, { usuario: { id: data.usuarioId } });
    if (existing) {
      existing.secret = data.secret;
      existing.verified = data.verified;
    } else {
      const usuario = await this.em.findOneOrFail(UsuarioEntity, { id: data.usuarioId });
      this.em.create(TotpSecretEntity, {
        id: randomUUID(),
        usuario,
        secret: data.secret,
        verified: data.verified,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async findByUsuarioId(usuarioId: string): Promise<TotpSecretData | null> {
    const entity = await this.em.findOne(TotpSecretEntity, { usuario: { id: usuarioId } }, { populate: ['usuario'] });
    if (!entity) return null;
    return {
      usuarioId: entity.usuario.id,
      secret: entity.secret,
      verified: entity.verified,
    };
  }

  async deleteByUsuarioId(usuarioId: string): Promise<void> {
    const entity = await this.em.findOne(TotpSecretEntity, { usuario: { id: usuarioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }
}
