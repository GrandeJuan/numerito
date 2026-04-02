import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'crypto';
import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';
import { Subscripcion, EstadoSubscripcion, CicloFacturacion } from '../../domain/entities/subscripcion.entity';
import { SubscripcionEntity } from './subscripcion.schema';
import { EstudioEntity } from './estudio.schema';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';
import { EstadoSubscripcionEntity } from '../../../shared/infrastructure/persistence/estado-subscripcion.schema';
import { CicloFacturacionEntity } from '../../../shared/infrastructure/persistence/ciclo-facturacion.schema';

@Injectable()
export class MikroOrmSubscripcionRepository implements SubscripcionRepository {
  constructor(private readonly em: EntityManager) {}

  async findByEstudioId(estudioId: string): Promise<Subscripcion[]> {
    const entities = await this.em.find(SubscripcionEntity, { estudio: { id: estudioId } }, {
      populate: ['plan', 'estadoSubscripcion', 'cicloFacturacion'],
    });
    return entities.map(e => this.toDomain(e));
  }

  async findActiva(estudioId: string): Promise<Subscripcion | null> {
    const entity = await this.em.findOne(SubscripcionEntity, {
      estudio: { id: estudioId },
      estadoSubscripcion: { codigo: { $in: [EstadoSubscripcion.ACTIVA, EstadoSubscripcion.TRIAL] } },
    }, { populate: ['plan', 'estadoSubscripcion', 'cicloFacturacion'] });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async save(subscripcion: Subscripcion): Promise<void> {
    const existing = await this.em.findOne(SubscripcionEntity, { id: subscripcion.id });
    const plan = await this.em.findOneOrFail(PlanEntity, { id: Number(subscripcion.planId) });
    const estado = await this.em.findOneOrFail(EstadoSubscripcionEntity, { codigo: subscripcion.estado });
    const ciclo = await this.em.findOneOrFail(CicloFacturacionEntity, { codigo: subscripcion.cicloFacturacion });

    if (existing) {
      existing.plan = plan;
      existing.estadoSubscripcion = estado;
      existing.cicloFacturacion = ciclo;
      existing.fechaFin = subscripcion.fechaFin;
      existing.autoRenovacion = subscripcion.autoRenovacion;
    } else {
      const estudio = await this.em.findOneOrFail(EstudioEntity, { id: subscripcion.estudioId });
      this.em.create(SubscripcionEntity, {
        id: subscripcion.id,
        estudio,
        plan,
        estadoSubscripcion: estado,
        cicloFacturacion: ciclo,
        fechaInicio: subscripcion.fechaInicio,
        fechaFin: subscripcion.fechaFin,
        autoRenovacion: subscripcion.autoRenovacion,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(subscripcion: Subscripcion): Promise<void> {
    const entity = await this.em.findOne(SubscripcionEntity, { id: subscripcion.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: SubscripcionEntity): Subscripcion {
    return Subscripcion.create({
      estudioId: entity.estudio.id,
      planId: String(entity.plan.id),
      fechaInicio: entity.fechaInicio,
      fechaFin: entity.fechaFin,
      estado: entity.estadoSubscripcion.codigo as EstadoSubscripcion,
      cicloFacturacion: entity.cicloFacturacion.codigo as CicloFacturacion,
      autoRenovacion: entity.autoRenovacion,
    }, entity.id);
  }
}
