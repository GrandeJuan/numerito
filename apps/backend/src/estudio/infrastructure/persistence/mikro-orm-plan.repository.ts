import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { PlanRepository, PlanData } from '../../domain/repositories/plan.repository';
import type { Plan } from '../../domain/value-objects/plan-subscripcion.vo';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';

@Injectable()
export class MikroOrmPlanRepository extends GlobalRepository<PlanData> implements PlanRepository {
  constructor(private readonly em: EntityManager) {
    super();
  }

  async findByPlan(plan: Plan): Promise<PlanData | null> {
    const entity = await this.em.findOne(PlanEntity, { codigo: plan });
    if (!entity) return null;
    return this.toData(entity);
  }

  async findAll(): Promise<PlanData[]> {
    const entities = await this.em.findAll(PlanEntity);
    return entities.map((e) => this.toData(e));
  }

  async save(data: PlanData): Promise<void> {
    const existing = await this.em.findOne(PlanEntity, { codigo: data.plan });
    if (existing) {
      existing.maxClientes = data.maxClientes;
      existing.maxUsuarios = data.maxUsuarios;
      existing.precio = data.precio;
    } else {
      this.em.create(PlanEntity, {
        codigo: data.plan,
        nombre: data.plan,
        maxClientes: data.maxClientes,
        maxUsuarios: data.maxUsuarios,
        precio: data.precio,
        isPublico: true,
        isActivo: true,
      });
    }
    await this.em.flush();
  }

  async findById(_id: string): Promise<PlanData | null> {
    throw new Error('Not implemented');
  }

  async delete(_entity: PlanData): Promise<void> {
    throw new Error('Not implemented');
  }

  private toData(entity: PlanEntity): PlanData {
    return {
      plan: entity.codigo as Plan,
      maxClientes: entity.maxClientes,
      maxUsuarios: entity.maxUsuarios,
      precio: entity.precio,
    };
  }
}
