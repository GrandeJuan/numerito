import { EntitySchema } from '@mikro-orm/core';
import { VencimientoEntity } from './vencimiento.schema';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

export class SugerenciaProrrogaEntity {
  id!: string;
  vencimiento!: VencimientoEntity;
  estudio!: EstudioEntity;
  clienteId!: string;
  tipoObligacion!: string;
  periodo!: string;
  fechaOriginal!: Date;
  fechaSugerida!: Date;
  motivo!: string;
  estado!: string;
  reglaActivaId!: string | null;
  ejecucionIngestaId!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export const SugerenciaProrrogaSchema = new EntitySchema<SugerenciaProrrogaEntity>({
  class: SugerenciaProrrogaEntity,
  tableName: 'sugerencia_prorroga',
  properties: {
    id: { type: 'uuid', primary: true },
    vencimiento: { kind: 'm:1', entity: () => VencimientoEntity, fieldName: 'vencimiento_id' },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    clienteId: { type: 'string', fieldName: 'cliente_id' },
    tipoObligacion: { type: 'string', fieldName: 'tipo_obligacion' },
    periodo: { type: 'string', length: 7 },
    fechaOriginal: { type: 'Date', fieldName: 'fecha_original' },
    fechaSugerida: { type: 'Date', fieldName: 'fecha_sugerida' },
    motivo: { type: 'string' },
    estado: { type: 'string', length: 20 },
    reglaActivaId: { type: 'string', fieldName: 'regla_activa_id', nullable: true },
    ejecucionIngestaId: { type: 'string', fieldName: 'ejecucion_ingesta_id', nullable: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
  indexes: [
    { properties: ['estudio'] },
    { properties: ['vencimiento'] },
    { properties: ['estudio', 'estado'] },
  ],
});
