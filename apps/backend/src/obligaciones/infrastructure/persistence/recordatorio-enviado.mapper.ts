import { z } from 'zod';
import type { Mapper } from '../../../shared/domain';
import {
  RecordatorioEnviado,
  TIPO_RECORDATORIO,
  CANAL_RECORDATORIO,
  type TipoRecordatorio,
  type CanalRecordatorio,
} from '../../domain/entities/recordatorio-enviado.entity';
import type { RecordatorioEnviadoEntity } from './recordatorio-enviado.schema';

const tipoRecordatorioValues = Object.values(TIPO_RECORDATORIO) as [string, ...string[]];
const canalRecordatorioValues = Object.values(CANAL_RECORDATORIO) as [string, ...string[]];

export const recordatorioEnviadoPersistenceSchema = z.object({
  id: z.string().min(1),
  vencimientoId: z.string().min(1),
  estudioId: z.string().min(1),
  clienteId: z.string().min(1),
  tipoRecordatorio: z.enum(tipoRecordatorioValues as [string, ...string[]]),
  canal: z.enum(canalRecordatorioValues as [string, ...string[]]),
  destinatarioId: z.string().min(1),
  fechaEnvio: z.date(),
});

export type RecordatorioEnviadoPersistence = z.infer<typeof recordatorioEnviadoPersistenceSchema>;

export class RecordatorioEnviadoMapper
  implements Mapper<RecordatorioEnviado, RecordatorioEnviadoPersistence>
{
  toDomain(persistence: RecordatorioEnviadoPersistence): RecordatorioEnviado {
    const data = recordatorioEnviadoPersistenceSchema.parse(persistence);
    return RecordatorioEnviado.reconstitute(
      {
        vencimientoId: data.vencimientoId,
        estudioId: data.estudioId,
        clienteId: data.clienteId,
        tipoRecordatorio: data.tipoRecordatorio as TipoRecordatorio,
        canal: data.canal as CanalRecordatorio,
        destinatarioId: data.destinatarioId,
        fechaEnvio: data.fechaEnvio,
      },
      data.id,
    );
  }

  toPersistence(domain: RecordatorioEnviado): RecordatorioEnviadoPersistence {
    return {
      id: domain.id,
      vencimientoId: domain.vencimientoId,
      estudioId: domain.estudioId,
      clienteId: domain.clienteId,
      tipoRecordatorio: domain.tipoRecordatorio,
      canal: domain.canal,
      destinatarioId: domain.destinatarioId,
      fechaEnvio: domain.fechaEnvio,
    };
  }

  fromSchema(entity: RecordatorioEnviadoEntity): RecordatorioEnviadoPersistence {
    return {
      id: entity.id,
      vencimientoId: entity.vencimiento?.id ?? (entity as any).vencimiento_id,
      estudioId: entity.estudio?.id ?? (entity as any).estudio_id,
      clienteId: entity.clienteId,
      tipoRecordatorio: entity.tipoRecordatorio,
      canal: entity.canal,
      destinatarioId: entity.destinatarioId,
      fechaEnvio: entity.fechaEnvio,
    };
  }
}
