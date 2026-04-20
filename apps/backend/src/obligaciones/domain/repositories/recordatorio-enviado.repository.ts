import type { RecordatorioEnviado, TipoRecordatorio } from '../entities/recordatorio-enviado.entity';

export interface RecordatorioEnviadoRepository {
  save(entity: RecordatorioEnviado): Promise<void>;
  existsForVencimiento(vencimientoId: string, tipoRecordatorio: TipoRecordatorio): Promise<boolean>;
  findByVencimientoId(vencimientoId: string): Promise<RecordatorioEnviado[]>;
}

export const RECORDATORIO_ENVIADO_REPOSITORY = Symbol('RecordatorioEnviadoRepository');
