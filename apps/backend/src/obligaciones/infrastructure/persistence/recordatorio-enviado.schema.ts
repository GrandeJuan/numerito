import { EntitySchema } from '@mikro-orm/core';
import { VencimientoEntity } from './vencimiento.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

export class RecordatorioEnviadoEntity {
  id!: string;
  vencimiento!: VencimientoEntity;
  estudio!: EstudioEntity;
  clienteId!: string;
  tipoRecordatorio!: string;
  canal!: string;
  destinatarioId!: string;
  fechaEnvio!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export const RecordatorioEnviadoSchema = new EntitySchema<RecordatorioEnviadoEntity>({
  class: RecordatorioEnviadoEntity,
  tableName: 'recordatorio_enviado',
  properties: {
    id: { type: 'uuid', primary: true },
    vencimiento: { kind: 'm:1', entity: () => VencimientoEntity, fieldName: 'vencimiento_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    clienteId: { type: 'string', fieldName: 'cliente_id' },
    tipoRecordatorio: { type: 'string', fieldName: 'tipo_recordatorio' },
    canal: { type: 'string' },
    destinatarioId: { type: 'string', fieldName: 'destinatario_id' },
    fechaEnvio: { type: 'Date', fieldName: 'fecha_envio' },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: {
      type: 'Date',
      fieldName: 'updated_at',
      onCreate: () => new Date(),
      onUpdate: () => new Date(),
    },
  },
  indexes: [
    { properties: ['vencimiento', 'tipoRecordatorio'], name: 'idx_recordatorio_venc_tipo' },
    { properties: ['estudio'] },
    { properties: ['fechaEnvio'] },
  ],
  uniques: [
    { properties: ['vencimiento', 'tipoRecordatorio', 'canal', 'destinatarioId'], name: 'uq_recordatorio_idempotent' },
  ],
});
