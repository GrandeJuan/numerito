import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';
import type { AdminPlanData, AdminPlanRepository } from '../../domain/repositories/admin-plan.repository';

@Injectable()
export class MikroOrmAdminPlanRepository implements AdminPlanRepository {
  constructor(private readonly em: EntityManager) {}

  async findAll(): Promise<AdminPlanData[]> {
    const plans = await this.em.findAll(PlanEntity, { orderBy: { id: 'ASC' } });
    return plans.map(this.toData);
  }

  async findById(id: number): Promise<AdminPlanData | null> {
    const plan = await this.em.findOne(PlanEntity, { id });
    return plan ? this.toData(plan) : null;
  }

  async findByCodigo(codigo: string): Promise<AdminPlanData | null> {
    const plan = await this.em.findOne(PlanEntity, { codigo });
    return plan ? this.toData(plan) : null;
  }

  async save(data: AdminPlanData): Promise<AdminPlanData> {
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
    return this.toData(entity);
  }

  private toData(entity: PlanEntity): AdminPlanData {
    return {
      id: entity.id,
      codigo: entity.codigo,
      nombre: entity.nombre,
      descripcion: entity.descripcion,
      maxClientes: entity.maxClientes,
      maxUsuarios: entity.maxUsuarios,
      precio: entity.precio,
      isPublico: entity.isPublico,
      isActivo: entity.isActivo,
      condiciones: entity.condiciones,
    };
  }
}
