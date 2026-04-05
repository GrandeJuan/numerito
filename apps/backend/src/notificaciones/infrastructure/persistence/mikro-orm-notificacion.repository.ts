import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { NotificacionRepository } from '../../domain/repositories/notificacion.repository';
import { Notificacion, TipoNotificacion } from '../../domain/entities/notificacion.entity';
import { NotificacionEntity } from './notificacion.schema';

@Injectable()
export class MikroOrmNotificacionRepository implements NotificacionRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Notificacion | null> {
    const entity = await this.em.findOne(NotificacionEntity, { id });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAll(): Promise<Notificacion[]> {
    const entities = await this.em.findAll(NotificacionEntity, {
      orderBy: { createdAt: 'DESC' },
    });
    return entities.map(e => this.toDomain(e));
  }

  async findByUsuarioAndEstudio(
    usuarioId: string,
    estudioId: string,
    options?: { leida?: boolean; limit?: number; offset?: number },
  ): Promise<{ data: Notificacion[]; total: number }> {
    const where: Record<string, unknown> = { usuarioId, estudioId };
    if (options?.leida !== undefined) {
      where.leida = options.leida;
    }

    const [entities, total] = await this.em.findAndCount(NotificacionEntity, where, {
      orderBy: { createdAt: 'DESC' },
      limit: options?.limit ?? 20,
      offset: options?.offset ?? 0,
    });

    return { data: entities.map(e => this.toDomain(e)), total };
  }

  async countUnread(usuarioId: string, estudioId: string): Promise<number> {
    return this.em.count(NotificacionEntity, { usuarioId, estudioId, leida: false });
  }

  async save(notificacion: Notificacion): Promise<void> {
    const existing = await this.em.findOne(NotificacionEntity, { id: notificacion.id });
    if (existing) {
      existing.usuarioId = notificacion.usuarioId;
      existing.estudioId = notificacion.estudioId ?? existing.estudioId;
      existing.tipo = notificacion.tipo;
      existing.mensaje = notificacion.mensaje;
      existing.leida = notificacion.leida;
    } else {
      this.em.create(NotificacionEntity, {
        id: notificacion.id,
        usuarioId: notificacion.usuarioId,
        estudioId: notificacion.estudioId ?? '',
        tipo: notificacion.tipo,
        mensaje: notificacion.mensaje,
        leida: notificacion.leida,
        createdAt: notificacion.createdAt,
        updatedAt: notificacion.updatedAt,
      });
    }
    await this.em.flush();
  }

  async delete(notificacion: Notificacion): Promise<void> {
    const entity = await this.em.findOne(NotificacionEntity, { id: notificacion.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: NotificacionEntity): Notificacion {
    const notif = Notificacion.create({
      usuarioId: entity.usuarioId,
      estudioId: entity.estudioId || undefined,
      tipo: entity.tipo as TipoNotificacion,
      mensaje: entity.mensaje,
    }, entity.id);

    if (entity.leida) {
      notif.marcarLeida();
    }

    return notif;
  }
}
