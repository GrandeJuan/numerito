import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import type { EstudioRepository } from '../../domain/repositories/estudio.repository';
import { Estudio } from '../../domain/entities/estudio.entity';
import { EstudioEntity } from './estudio.schema';
import { EstudioMapper } from './estudio.mapper';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';

@Injectable()
export class MikroOrmEstudioRepository
  extends GlobalRepository<Estudio>
  implements EstudioRepository
{
  private readonly mapper = new EstudioMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findById(id: string): Promise<Estudio | null> {
    const entity = await this.em.findOne(EstudioEntity, { id }, { populate: ['plan'] });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findByCuit(cuit: string): Promise<Estudio | null> {
    const entity = await this.em.findOne(EstudioEntity, { cuit }, { populate: ['plan'] });
    if (!entity) return null;
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async findAll(): Promise<Estudio[]> {
    const entities = await this.em.findAll(EstudioEntity, { populate: ['plan'] });
    return entities.map((e) => this.mapper.toDomain(this.mapper.fromSchema(e)));
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
}
