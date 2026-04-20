import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { ReglaVencimiento } from '../../domain/entities/regla-vencimiento.entity';
import type { ReglaVencimientoEntity } from './regla-vencimiento.schema';
import type { TipoObligacion, Jurisdiccion, OrigenRegla, EstadoRegla } from '@numerito/shared';

export const reglaVencimientoPersistenceSchema = z.object({
  id: z.string().min(1),
  tipoObligacion: z.string().min(1),
  jurisdiccion: z.string().min(1),
  regimen: z.string().min(1),
  terminacionCuit: z.string().length(1),
  diaVencimiento: z.number().int(),
  mesSiguiente: z.boolean(),
  vigenciaDesde: z.date(),
  vigenciaHasta: z.date().nullable(),
  origen: z.string().min(1),
  estado: z.string().min(1),
});

export type ReglaVencimientoPersistence = z.infer<typeof reglaVencimientoPersistenceSchema>;

export class ReglaVencimientoMapper
  implements Mapper<ReglaVencimiento, ReglaVencimientoPersistence>
{
  toDomain(persistence: ReglaVencimientoPersistence): ReglaVencimiento {
    const data = reglaVencimientoPersistenceSchema.parse(persistence);
    return ReglaVencimiento.reconstitute(
      {
        tipoObligacion: data.tipoObligacion as TipoObligacion,
        jurisdiccion: data.jurisdiccion as Jurisdiccion,
        regimen: data.regimen,
        terminacionCuit: data.terminacionCuit,
        diaVencimiento: data.diaVencimiento,
        mesSiguiente: data.mesSiguiente,
        vigenciaDesde: data.vigenciaDesde,
        vigenciaHasta: data.vigenciaHasta,
        origen: data.origen as OrigenRegla,
        estado: data.estado as EstadoRegla,
      },
      data.id,
    );
  }

  toPersistence(domain: ReglaVencimiento): ReglaVencimientoPersistence {
    return {
      id: domain.id,
      tipoObligacion: domain.tipoObligacion,
      jurisdiccion: domain.jurisdiccion,
      regimen: domain.regimen,
      terminacionCuit: domain.terminacionCuit,
      diaVencimiento: domain.diaVencimiento,
      mesSiguiente: domain.mesSiguiente,
      vigenciaDesde: domain.vigenciaDesde,
      vigenciaHasta: domain.vigenciaHasta,
      origen: domain.origen,
      estado: domain.estado,
    };
  }

  fromSchema(entity: ReglaVencimientoEntity): ReglaVencimientoPersistence {
    return {
      id: String(entity.id),
      tipoObligacion: entity.tipoObligacion.codigo as TipoObligacion,
      jurisdiccion: entity.jurisdiccion,
      regimen: entity.regimen,
      terminacionCuit: entity.terminacionCuit,
      diaVencimiento: entity.diaVencimiento,
      mesSiguiente: entity.mesSiguiente,
      vigenciaDesde: entity.vigenciaDesde,
      vigenciaHasta: entity.vigenciaHasta,
      origen: entity.origen,
      estado: entity.estado,
    };
  }
}
