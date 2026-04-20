import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import {
  SugerenciaProrroga,
  ESTADO_SUGERENCIA,
  type EstadoSugerencia,
} from '../../domain/entities/sugerencia-prorroga.entity';
import type { SugerenciaProrrogaEntity } from './sugerencia-prorroga.schema';

const estadoValues = Object.values(ESTADO_SUGERENCIA) as [
  EstadoSugerencia,
  ...EstadoSugerencia[],
];

export const sugerenciaProrrogaPersistenceSchema = z.object({
  id: z.string().min(1),
  vencimientoId: z.string().min(1),
  estudioId: z.string().min(1),
  clienteId: z.string().min(1),
  tipoObligacion: z.string().min(1),
  periodo: z.string().min(1),
  fechaOriginal: z.date(),
  fechaSugerida: z.date(),
  motivo: z.string().min(1),
  estado: z.enum(estadoValues),
  reglaActivaId: z.string().nullable(),
  ejecucionIngestaId: z.string().nullable(),
});

export type SugerenciaProrrogaPersistence = z.infer<typeof sugerenciaProrrogaPersistenceSchema>;

export class SugerenciaProrrogaMapper
  implements Mapper<SugerenciaProrroga, SugerenciaProrrogaPersistence>
{
  toDomain(persistence: SugerenciaProrrogaPersistence): SugerenciaProrroga {
    const data = sugerenciaProrrogaPersistenceSchema.parse(persistence);
    return SugerenciaProrroga.reconstitute(
      {
        vencimientoId: data.vencimientoId,
        estudioId: data.estudioId,
        clienteId: data.clienteId,
        tipoObligacion: data.tipoObligacion,
        periodo: data.periodo,
        fechaOriginal: data.fechaOriginal,
        fechaSugerida: data.fechaSugerida,
        motivo: data.motivo,
        estado: data.estado,
        reglaActivaId: data.reglaActivaId,
        ejecucionIngestaId: data.ejecucionIngestaId,
      },
      data.id,
    );
  }

  toPersistence(domain: SugerenciaProrroga): SugerenciaProrrogaPersistence {
    return {
      id: domain.id,
      vencimientoId: domain.vencimientoId,
      estudioId: domain.estudioId,
      clienteId: domain.clienteId,
      tipoObligacion: domain.tipoObligacion,
      periodo: domain.periodo,
      fechaOriginal: domain.fechaOriginal,
      fechaSugerida: domain.fechaSugerida,
      motivo: domain.motivo,
      estado: domain.estado,
      reglaActivaId: domain.reglaActivaId,
      ejecucionIngestaId: domain.ejecucionIngestaId,
    };
  }

  fromSchema(entity: SugerenciaProrrogaEntity): SugerenciaProrrogaPersistence {
    return {
      id: entity.id,
      vencimientoId: entity.vencimiento.id,
      estudioId: entity.estudio.id,
      clienteId: entity.clienteId,
      tipoObligacion: entity.tipoObligacion,
      periodo: entity.periodo,
      fechaOriginal: entity.fechaOriginal,
      fechaSugerida: entity.fechaSugerida,
      motivo: entity.motivo,
      estado: entity.estado as EstadoSugerencia,
      reglaActivaId: entity.reglaActivaId,
      ejecucionIngestaId: entity.ejecucionIngestaId,
    };
  }
}
