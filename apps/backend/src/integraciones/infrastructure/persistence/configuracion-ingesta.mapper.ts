import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import { ConfiguracionIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import type { FuenteIngesta } from '../../domain/entities/configuracion-ingesta.entity';
import type { ConfiguracionIngestaEntity } from './configuracion-ingesta.schema';

export const configuracionIngestaPersistenceSchema = z.object({
  id: z.string().min(1),
  fuente: z.string().min(1),
  habilitado: z.boolean(),
  cadenciaDias: z.number().int().min(1),
  proximaEjecucion: z.date().nullable(),
  ultimaEjecucion: z.date().nullable(),
  ultimoResultado: z.string().nullable(),
});

export type ConfiguracionIngestaPersistence = z.infer<typeof configuracionIngestaPersistenceSchema>;

export class ConfiguracionIngestaMapper
  implements Mapper<ConfiguracionIngesta, ConfiguracionIngestaPersistence>
{
  toDomain(persistence: ConfiguracionIngestaPersistence): ConfiguracionIngesta {
    const data = configuracionIngestaPersistenceSchema.parse(persistence);
    return ConfiguracionIngesta.reconstitute(
      {
        fuente: data.fuente as FuenteIngesta,
        habilitado: data.habilitado,
        cadenciaDias: data.cadenciaDias,
        proximaEjecucion: data.proximaEjecucion,
        ultimaEjecucion: data.ultimaEjecucion,
        ultimoResultado: data.ultimoResultado,
      },
      data.id,
    );
  }

  toPersistence(domain: ConfiguracionIngesta): ConfiguracionIngestaPersistence {
    return {
      id: domain.id,
      fuente: domain.fuente,
      habilitado: domain.habilitado,
      cadenciaDias: domain.cadenciaDias,
      proximaEjecucion: domain.proximaEjecucion,
      ultimaEjecucion: domain.ultimaEjecucion,
      ultimoResultado: domain.ultimoResultado,
    };
  }

  fromSchema(entity: ConfiguracionIngestaEntity): ConfiguracionIngestaPersistence {
    return {
      id: entity.id,
      fuente: entity.fuente,
      habilitado: entity.habilitado,
      cadenciaDias: entity.cadenciaDias,
      proximaEjecucion: entity.proximaEjecucion,
      ultimaEjecucion: entity.ultimaEjecucion,
      ultimoResultado: entity.ultimoResultado,
    };
  }
}
