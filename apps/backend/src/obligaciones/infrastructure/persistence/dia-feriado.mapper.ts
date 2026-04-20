import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { DiaFeriado } from '../../domain/entities/dia-feriado.entity';
import type { TipoFeriado } from '@numerito/shared';
import type { DiaFeriadoEntity } from './dia-feriado.schema';

export const diaFeriadoPersistenceSchema = z.object({
  id: z.string().min(1),
  fecha: z.date(),
  tipo: z.string().min(1),
  descripcion: z.string().min(1),
  jurisdiccionAfectada: z.string().nullable(),
});

export type DiaFeriadoPersistence = z.infer<typeof diaFeriadoPersistenceSchema>;

export class DiaFeriadoMapper implements Mapper<DiaFeriado, DiaFeriadoPersistence> {
  toDomain(persistence: DiaFeriadoPersistence): DiaFeriado {
    const data = diaFeriadoPersistenceSchema.parse(persistence);
    return DiaFeriado.reconstitute(
      {
        fecha: data.fecha,
        tipo: data.tipo as TipoFeriado,
        descripcion: data.descripcion,
        jurisdiccionAfectada: data.jurisdiccionAfectada,
      },
      data.id,
    );
  }

  toPersistence(domain: DiaFeriado): DiaFeriadoPersistence {
    return {
      id: domain.id,
      fecha: domain.fecha,
      tipo: domain.tipo,
      descripcion: domain.descripcion,
      jurisdiccionAfectada: domain.jurisdiccionAfectada,
    };
  }

  fromSchema(entity: DiaFeriadoEntity): DiaFeriadoPersistence {
    return {
      id: entity.id,
      fecha: entity.fecha,
      tipo: entity.tipo,
      descripcion: entity.descripcion,
      jurisdiccionAfectada: entity.jurisdiccionAfectada,
    };
  }
}
