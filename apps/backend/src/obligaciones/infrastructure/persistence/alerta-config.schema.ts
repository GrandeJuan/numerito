import { EntitySchema } from '@mikro-orm/core';
import { EstudioEntity } from '../../../estudio/infrastructure/persistence/estudio.schema';

export class AlertaConfigEntity {
  id!: string;
  estudio!: EstudioEntity;
  diasAnticipacion!: number;
  canalNotificacion!: string;
  activa!: boolean;
}

export const AlertaConfigSchema = new EntitySchema<AlertaConfigEntity>({
  class: AlertaConfigEntity,
  tableName: 'alerta_config',
  properties: {
    id: { type: 'uuid', primary: true },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id', unique: true },
    diasAnticipacion: { type: 'number', fieldName: 'dias_anticipacion', columnType: 'int' },
    canalNotificacion: { type: 'string', fieldName: 'canal_notificacion' },
    activa: { type: 'boolean', default: true },
  },
});
