import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { GlobalRepository } from '../../../shared/domain';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';
import type {
  AdminPlanData,
  AdminPlanRepository,
} from '../../domain/repositories/admin-plan.repository';
import { AdminPlanMapper } from './admin-plan.mapper';

@Injectable()
export class MikroOrmAdminPlanRepository
  extends GlobalRepository<AdminPlanData>
  implements AdminPlanRepository
{
  private readonly mapper = new AdminPlanMapper();

  constructor(private readonly em: EntityManager) {
    super();
  }

  async findAll(): Promise<AdminPlanData[]> {
    const plans = await this.em.findAll(PlanEntity, { orderBy: { id: 'ASC' } });
    return plans.map((p) => this.mapper.toDomain(this.mapper.fromSchema(p)));
  }

  async findById(id: string | number): Promise<AdminPlanData | null> {
    const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
    const plan = await this.em.findOne(PlanEntity, { id: numericId });
    return plan ? this.mapper.toDomain(this.mapper.fromSchema(plan)) : null;
  }

  async findByCodigo(codigo: string): Promise<AdminPlanData | null> {
    const plan = await this.em.findOne(PlanEntity, { codigo });
    return plan ? this.mapper.toDomain(this.mapper.fromSchema(plan)) : null;
  }

  async save(data: AdminPlanData): Promise<any> {
    let entity: PlanEntity;

    if (data.id) {
      entity = await this.em.findOneOrFail(PlanEntity, { id: data.id });
      entity.nombre = data.nombre;
      entity.descripcion = data.descripcion;
      entity.maxClientes = data.maxClientes;
      entity.maxUsuarios = data.maxUsuarios;
      entity.precio = data.precio;
      entity.isPublico = data.isPublico;
      entity.isActivo = data.isActivo;
      entity.condiciones = data.condiciones;
    } else {
      entity = this.em.create(PlanEntity, {
        codigo: data.codigo,
        nombre: data.nombre,
        descripcion: data.descripcion,
        maxClientes: data.maxClientes,
        maxUsuarios: data.maxUsuarios,
        precio: data.precio,
        isPublico: data.isPublico,
        isActivo: data.isActivo,
        condiciones: data.condiciones,
      });
      this.em.persist(entity);
    }

    await this.em.flush();
    return this.mapper.toDomain(this.mapper.fromSchema(entity));
  }

  async delete(_entity: AdminPlanData): Promise<void> {
    throw new Error('Not implemented');
  }
}
