import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { EjecucionIngesta } from '../../domain/entities/ejecucion-ingesta.entity';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import type {
  EstadoEjecucion,
  DisparadorIngesta,
} from '../../domain/entities/ejecucion-ingesta.entity';
import type { EjecucionIngestaEntity } from './ejecucion-ingesta.schema';

export const ejecucionIngestaPersistenceSchema = z.object({
  id: z.string().min(1),
  fuente: z.string().min(1),
  estado: z.string().min(1),
  disparador: z.string().min(1),
  disparadoPor: z.string().nullable(),
  ingestaId: z.string().nullable(),
  launcherTaskId: z.string().nullable(),
  inicio: z.date(),
  fin: z.date().nullable(),
  reglasNuevas: z.number().int().min(0),
  reglasModificadas: z.number().int().min(0),
  errores: z.array(z.string()),
});

export type EjecucionIngestaPersistence = z.infer<typeof ejecucionIngestaPersistenceSchema>;

export class EjecucionIngestaMapper implements Mapper<
  EjecucionIngesta,
  EjecucionIngestaPersistence
> {
  toDomain(persistence: EjecucionIngestaPersistence): EjecucionIngesta {
    const data = ejecucionIngestaPersistenceSchema.parse(persistence);
    return EjecucionIngesta.reconstitute(
      {
        fuente: data.fuente as FuenteIngesta,
        estado: data.estado as EstadoEjecucion,
        disparador: data.disparador as DisparadorIngesta,
        disparadoPor: data.disparadoPor,
        ingestaId: data.ingestaId,
        launcherTaskId: data.launcherTaskId,
        inicio: data.inicio,
        fin: data.fin,
        reglasNuevas: data.reglasNuevas,
        reglasModificadas: data.reglasModificadas,
        errores: data.errores,
      },
      data.id,
    );
  }

  toPersistence(domain: EjecucionIngesta): EjecucionIngestaPersistence {
    return {
      id: domain.id,
      fuente: domain.fuente,
      estado: domain.estado,
      disparador: domain.disparador,
      disparadoPor: domain.disparadoPor,
      ingestaId: domain.ingestaId,
      launcherTaskId: domain.launcherTaskId,
      inicio: domain.inicio,
      fin: domain.fin,
      reglasNuevas: domain.reglasNuevas,
      reglasModificadas: domain.reglasModificadas,
      errores: domain.errores,
    };
  }

  fromSchema(entity: EjecucionIngestaEntity): EjecucionIngestaPersistence {
    return {
      id: entity.id,
      fuente: entity.fuente,
      estado: entity.estado,
      disparador: entity.disparador,
      disparadoPor: entity.disparadoPor,
      ingestaId: entity.ingestaId,
      launcherTaskId: entity.launcherTaskId,
      inicio: entity.inicio,
      fin: entity.fin,
      reglasNuevas: entity.reglasNuevas,
      reglasModificadas: entity.reglasModificadas,
      errores: entity.errores,
    };
  }
}
