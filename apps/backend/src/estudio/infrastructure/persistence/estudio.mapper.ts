import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { Estudio } from '../../domain/entities/estudio.entity';
import { NombreEstudio } from '../../domain/value-objects/nombre-estudio.vo';
import { PlanSubscripcion, type Plan } from '../../domain/value-objects/plan-subscripcion.vo';
import type { EstudioEntity } from './estudio.schema';

export const estudioPersistenceSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1),
  planCodigo: z.string().min(1),
  planMaxClientes: z.number().int().nonnegative(),
  planMaxUsuarios: z.number().int().nonnegative(),
  cuit: z.string().min(1),
  isActive: z.boolean(),
});

export type EstudioPersistence = z.infer<typeof estudioPersistenceSchema>;

export class EstudioMapper implements Mapper<Estudio, EstudioPersistence> {
  toDomain(persistence: EstudioPersistence): Estudio {
    const data = estudioPersistenceSchema.parse(persistence);
    return Estudio.reconstitute(
      {
        nombre: NombreEstudio.create(data.nombre),
        plan: PlanSubscripcion.create(
          data.planCodigo as Plan,
          data.planMaxClientes,
          data.planMaxUsuarios,
        ),
        cuit: data.cuit,
        isActive: data.isActive,
      },
      data.id,
    );
  }

  toPersistence(domain: Estudio): EstudioPersistence {
    return {
      id: domain.id,
      nombre: domain.nombre.value,
      planCodigo: domain.plan.value,
      planMaxClientes: domain.plan.maxClientes,
      planMaxUsuarios: domain.plan.maxUsuarios,
      cuit: domain.cuit,
      isActive: domain.isActive,
    };
  }

  fromSchema(entity: EstudioEntity): EstudioPersistence {
    return {
      id: entity.id,
      nombre: entity.nombre,
      planCodigo: entity.plan.codigo,
      planMaxClientes: entity.plan.maxClientes,
      planMaxUsuarios: entity.plan.maxUsuarios,
      cuit: entity.cuit,
      isActive: entity.isActive,
    };
  }
}
