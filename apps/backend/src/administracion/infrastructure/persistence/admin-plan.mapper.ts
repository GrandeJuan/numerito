import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import type { AdminPlanData } from '../../domain/repositories/admin-plan.repository';
import type { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';

export const adminPlanPersistenceSchema = z.object({
  id: z.number().int().optional(),
  codigo: z.string().min(1),
  nombre: z.string().min(1),
  descripcion: z.string().optional(),
  maxClientes: z.number().int().nonnegative(),
  maxUsuarios: z.number().int().nonnegative(),
  precio: z.number().nonnegative(),
  isPublico: z.boolean(),
  isActivo: z.boolean(),
  condiciones: z.record(z.string(), z.unknown()).optional(),
});

export type AdminPlanPersistence = z.infer<typeof adminPlanPersistenceSchema>;

export class AdminPlanMapper implements Mapper<AdminPlanData, AdminPlanPersistence> {
  toDomain(persistence: AdminPlanPersistence): AdminPlanData {
    const data = adminPlanPersistenceSchema.parse(persistence);
    return {
      id: data.id,
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      maxClientes: data.maxClientes,
      maxUsuarios: data.maxUsuarios,
      precio: data.precio,
      isPublico: data.isPublico,
      isActivo: data.isActivo,
      condiciones: data.condiciones,
    };
  }

  toPersistence(domain: AdminPlanData): AdminPlanPersistence {
    return {
      id: domain.id,
      codigo: domain.codigo,
      nombre: domain.nombre,
      descripcion: domain.descripcion,
      maxClientes: domain.maxClientes,
      maxUsuarios: domain.maxUsuarios,
      precio: domain.precio,
      isPublico: domain.isPublico,
      isActivo: domain.isActivo,
      condiciones: domain.condiciones,
    };
  }

  fromSchema(entity: PlanEntity): AdminPlanPersistence {
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
