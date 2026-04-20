import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { CatalogoObligacion } from '../../domain/entities/catalogo-obligacion.entity';
import type { CatalogoObligacionEntity } from './catalogo-obligacion.schema';
import type { TipoObligacion, Jurisdiccion, FrecuenciaObligacion } from '@numerito/shared';

export const catalogoObligacionPersistenceSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tipoObligacion: z.string().min(1),
  jurisdiccion: z.string().min(1),
  frecuencia: z.string().min(1),
  activo: z.boolean(),
});

export type CatalogoObligacionPersistence = z.infer<typeof catalogoObligacionPersistenceSchema>;

export class CatalogoObligacionMapper
  implements Mapper<CatalogoObligacion, CatalogoObligacionPersistence>
{
  toDomain(persistence: CatalogoObligacionPersistence): CatalogoObligacion {
    const data = catalogoObligacionPersistenceSchema.parse(persistence);
    return CatalogoObligacion.reconstitute(
      {
        nombre: data.nombre,
        tipoObligacion: data.tipoObligacion as TipoObligacion,
        jurisdiccion: data.jurisdiccion as Jurisdiccion,
        frecuencia: data.frecuencia as FrecuenciaObligacion,
        activo: data.activo,
      },
      data.id,
    );
  }

  toPersistence(domain: CatalogoObligacion): CatalogoObligacionPersistence {
    return {
      id: domain.id,
      nombre: domain.nombre,
      tipoObligacion: domain.tipoObligacion,
      jurisdiccion: domain.jurisdiccion,
      frecuencia: domain.frecuencia,
      activo: domain.activo,
    };
  }

  fromSchema(entity: CatalogoObligacionEntity): CatalogoObligacionPersistence {
    return {
      id: entity.id,
      nombre: entity.nombre,
      tipoObligacion: entity.tipoObligacion,
      jurisdiccion: entity.jurisdiccion,
      frecuencia: entity.frecuencia,
      activo: entity.activo,
    };
  }
}
