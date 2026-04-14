import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { NotificacionRepository } from '../../domain/repositories/notificacion.repository';
import { Notificacion, TipoNotificacion } from '../../domain/entities/notificacion.entity';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { NotificacionEntity } from './notificacion.schema';

@Injectable()
export class MikroOrmNotificacionRepository
  extends TenantAwareRepository<Notificacion>
  implements NotificacionRepository
{
  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(id: string): Promise<Notificacion | null> {
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(NotificacionEntity, {
      id,
      estudioId: tenantId,
    });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAll(): Promise<Notificacion[]> {
    const tenantId = this.getTenantId();
    const entities = await this.em.find(
      NotificacionEntity,
      {
        estudioId: tenantId,
      },
      {
        orderBy: { createdAt: 'DESC' },
      },
    );
    return entities.map((e) => this.toDomain(e));
  }

  async findByUsuario(
    usuarioId: string,
    options?: { leida?: boolean; limit?: number; offset?: number },
  ): Promise<{ data: Notificacion[]; total: number }> {
    const tenantId = this.getTenantId();
    const where: Record<string, unknown> = { usuarioId, estudioId: tenantId };
    if (options?.leida !== undefined) {
      where.leida = options.leida;
    }

    const [entities, total] = await this.em.findAndCount(NotificacionEntity, where, {
      orderBy: { createdAt: 'DESC' },
      limit: options?.limit ?? 20,
      offset: options?.offset ?? 0,
    });

    return { data: entities.map((e) => this.toDomain(e)), total };
  }

  async countUnread(usuarioId: string): Promise<number> {
    const tenantId = this.getTenantId();
    return this.em.count(NotificacionEntity, { usuarioId, estudioId: tenantId, leida: false });
  }

  async save(notificacion: Notificacion): Promise<void> {
    const tenantId = this.getTenantId();
    const existing = await this.em.findOne(NotificacionEntity, { id: notificacion.id, estudioId: tenantId });
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
    const tenantId = this.getTenantId();
    const entity = await this.em.findOne(NotificacionEntity, { id: notificacion.id, estudioId: tenantId });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: NotificacionEntity): Notificacion {
    const notif = Notificacion.create(
      {
        usuarioId: entity.usuarioId,
        estudioId: entity.estudioId || undefined,
        tipo: entity.tipo as TipoNotificacion,
        mensaje: entity.mensaje,
      },
      entity.id,
    );

    if (entity.leida) {
      notif.marcarLeida();
    }

    return notif;
  }
}
