import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import {
  Subscripcion,
  EstadoSubscripcion,
  CicloFacturacion,
} from '../../domain/entities/subscripcion.entity';
import type { SubscripcionEntity } from './subscripcion.schema';

const estadoSubscripcionValues = Object.values(EstadoSubscripcion) as [
  EstadoSubscripcion,
  ...EstadoSubscripcion[],
];
const cicloFacturacionValues = Object.values(CicloFacturacion) as [
  CicloFacturacion,
  ...CicloFacturacion[],
];

export const subscripcionPersistenceSchema = z.object({
  id: z.string().uuid(),
  estudioId: z.string().min(1),
  planId: z.string().min(1),
  fechaInicio: z.date(),
  fechaFin: z.date(),
  estado: z.enum(estadoSubscripcionValues),
  cicloFacturacion: z.enum(cicloFacturacionValues),
  autoRenovacion: z.boolean(),
});

export type SubscripcionPersistence = z.infer<typeof subscripcionPersistenceSchema>;

export class SubscripcionMapper implements Mapper<Subscripcion, SubscripcionPersistence> {
  toDomain(persistence: SubscripcionPersistence): Subscripcion {
    const data = subscripcionPersistenceSchema.parse(persistence);
    return Subscripcion.reconstitute(
      {
        estudioId: data.estudioId,
        planId: data.planId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        estado: data.estado,
        cicloFacturacion: data.cicloFacturacion,
        autoRenovacion: data.autoRenovacion,
      },
      data.id,
    );
  }

  toPersistence(domain: Subscripcion): SubscripcionPersistence {
    return {
      id: domain.id,
      estudioId: domain.estudioId,
      planId: domain.planId,
      fechaInicio: domain.fechaInicio,
      fechaFin: domain.fechaFin,
      estado: domain.estado,
      cicloFacturacion: domain.cicloFacturacion,
      autoRenovacion: domain.autoRenovacion,
    };
  }

  fromSchema(entity: SubscripcionEntity): SubscripcionPersistence {
    return {
      id: entity.id,
      estudioId: entity.estudio.id,
      planId: String(entity.plan.id),
      fechaInicio: entity.fechaInicio,
      fechaFin: entity.fechaFin,
      estado: entity.estadoSubscripcion.codigo as EstadoSubscripcion,
      cicloFacturacion: entity.cicloFacturacion.codigo as CicloFacturacion,
      autoRenovacion: entity.autoRenovacion,
    };
  }
}
