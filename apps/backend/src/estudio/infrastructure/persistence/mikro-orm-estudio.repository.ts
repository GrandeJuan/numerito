import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import type { EstudioRepository } from '../../domain/repositories/estudio.repository';
import { Estudio } from '../../domain/entities/estudio.entity';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion, type Plan } from '../../domain/value-objects/plan-subscripcion.vo';
import { EstudioEntity } from './estudio.schema';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';

@Injectable()
export class MikroOrmEstudioRepository implements EstudioRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Estudio | null> {
    const entity = await this.em.findOne(EstudioEntity, { id }, { populate: ['plan'] });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findByCuit(cuit: string): Promise<Estudio | null> {
    const entity = await this.em.findOne(EstudioEntity, { cuit }, { populate: ['plan'] });
    if (!entity) return null;
    return this.toDomain(entity);
  }

  async findAll(): Promise<Estudio[]> {
    const entities = await this.em.findAll(EstudioEntity, { populate: ['plan'] });
    return entities.map(e => this.toDomain(e));
  }

  async save(estudio: Estudio): Promise<void> {
    const plan = await this.em.findOneOrFail(PlanEntity, { codigo: estudio.plan.value });
    const existing = await this.em.findOne(EstudioEntity, { id: estudio.id });
    if (existing) {
      existing.nombre = estudio.nombre.value;
      existing.plan = plan;
      existing.cuit = estudio.cuit;
      existing.isActive = estudio.isActive;
    } else {
      this.em.create(EstudioEntity, {
        id: estudio.id,
        nombre: estudio.nombre.value,
        plan,
        cuit: estudio.cuit,
        isActive: estudio.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await this.em.flush();
  }

  async delete(estudio: Estudio): Promise<void> {
    const entity = await this.em.findOne(EstudioEntity, { id: estudio.id });
    if (entity) {
      this.em.remove(entity);
      await this.em.flush();
    }
  }

  private toDomain(entity: EstudioEntity): Estudio {
    return Estudio.create({
      nombre: NombreEstudio.create(entity.nombre),
      plan: PlanSubscripcion.create(
        entity.plan.codigo as Plan,
        entity.plan.maxClientes,
        entity.plan.maxUsuarios,
      ),
      cuit: entity.cuit,
    }, entity.id);
  }
}
