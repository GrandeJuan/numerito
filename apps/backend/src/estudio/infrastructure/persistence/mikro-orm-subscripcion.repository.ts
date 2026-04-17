import { Injectable, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { SubscripcionRepository } from '../../domain/repositories/subscripcion.repository';
import {
  type Subscripcion,
  EstadoSubscripcion,
} from '../../domain/entities/subscripcion.entity';
import type { EstudioPrincipal } from '../../../shared/domain/estudio-principal';
import { TenantAwareRepository } from '../../../shared/domain';
import {
  RequestContextService,
  REQUEST_CONTEXT,
} from '../../../shared/infrastructure/services/request-context.service';
import { SubscripcionEntity } from './subscripcion.schema';
import { SubscripcionMapper } from './subscripcion.mapper';
import { EstudioEntity } from './estudio.schema';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';
import { EstadoSubscripcionEntity } from '../../../shared/infrastructure/persistence/estado-subscripcion.schema';
import { CicloFacturacionEntity } from '../../../shared/infrastructure/persistence/ciclo-facturacion.schema';

@Injectable()
export class MikroOrmSubscripcionRepository
  extends TenantAwareRepository<Subscripcion>
  implements SubscripcionRepository
{
  private readonly mapper = new SubscripcionMapper();

  constructor(
    @Inject(REQUEST_CONTEXT) context: RequestContextService,
    private readonly em: EntityManager,
  ) {
    super(context);
  }

  async findById(principal: EstudioPrincipal, id: string): Promise<Subscripcion | null> {
    const entity = await this.em.findOne(
      SubscripcionEntity,
      {
        id,
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['plan', 'estadoSubscripcion', 'cicloFacturacion'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(principal: EstudioPrincipal): Promise<Subscripcion[]> {
    const entities = await this.em.find(
      SubscripcionEntity,
      {
        estudio: { id: principal.estudioId },
      },
      {
        populate: ['plan', 'estadoSubscripcion', 'cicloFacturacion'],
      },
    );
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
  }

  async findActiva(principal: EstudioPrincipal): Promise<Subscripcion | null> {
    const entity = await this.em.findOne(
      SubscripcionEntity,
      {
        estudio: { id: principal.estudioId },
        estadoSubscripcion: {
          codigo: { $in: [EstadoSubscripcion.ACTIVA, EstadoSubscripcion.TRIAL] },
        },
      },
      {
        populate: ['plan', 'estadoSubscripcion', 'cicloFacturacion'],
      },
    );
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async save(principal: EstudioPrincipal, subscripcion: Subscripcion): Promise<void> {
    const existing = await this.em.findOne(SubscripcionEntity, { id: subscripcion.id, estudio: { id: principal.estudioId } });
    const plan = await this.em.findOneOrFail(PlanEntity, { id: Number(subscripcion.planId) });
    const estado = await this.em.findOneOrFail(EstadoSubscripcionEntity, {
      codigo: subscripcion.estado,
    });
    const ciclo = await this.em.findOneOrFail(CicloFacturacionEntity, {
      codigo: subscripcion.cicloFacturacion,
    });

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

  async delete(principal: EstudioPrincipal, subscripcion: Subscripcion): Promise<void> {
    const entity = await this.em.findOne(SubscripcionEntity, { id: subscripcion.id, estudio: { id: principal.estudioId } });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

}
