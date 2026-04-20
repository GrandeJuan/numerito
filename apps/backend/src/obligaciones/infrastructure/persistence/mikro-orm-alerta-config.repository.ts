import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { AlertaConfigRepository, AlertaConfigData } from '../../domain/repositories/alerta-config.repository';
import { AlertaConfigEntity } from './alerta-config.schema';

@Injectable()
export class MikroOrmAlertaConfigRepository implements AlertaConfigRepository {
  constructor(private readonly em: EntityManager) {}

  async findConfig(): Promise<AlertaConfigData | null> {
    const entity = await this.em.findOne(AlertaConfigEntity, {});
    if (!entity) return null;
    return this.toData(entity);
  }

  async findByEstudioId(estudioId: string): Promise<AlertaConfigData | null> {
    const entity = await this.em.findOne(AlertaConfigEntity, {
      estudio: estudioId as any,
    });
    if (!entity) return null;
    return this.toData(entity);
  }

  async findAllActivas(): Promise<AlertaConfigData[]> {
    const entities = await this.em.find(AlertaConfigEntity, { activa: true });
    return entities.map((e) => this.toData(e));
  }

  async save(config: AlertaConfigData): Promise<void> {
    const existing = await this.em.findOne(AlertaConfigEntity, {
      estudio: config.estudioId as any,
    });

    if (existing) {
      existing.diasAnticipacion = config.diasAnticipacion;
      existing.canalNotificacion = config.canalNotificacion;
      existing.activa = config.activa;
    } else {
      this.em.create(AlertaConfigEntity, {
        id: crypto.randomUUID(),
        estudio: config.estudioId as any,
        diasAnticipacion: config.diasAnticipacion,
        canalNotificacion: config.canalNotificacion,
        activa: config.activa,
      });
    }
    await this.em.flush();
  }

  private toData(entity: AlertaConfigEntity): AlertaConfigData {
    return {
      estudioId: (entity.estudio as any)?.id ?? (entity as any).estudio_id ?? (entity.estudio as any),
      diasAnticipacion: entity.diasAnticipacion,
      canalNotificacion: entity.canalNotificacion as AlertaConfigData['canalNotificacion'],
      activa: entity.activa,
    };
  }
}
