import { EntitySchema } from '@mikro-orm/core';
import { EstudioEntity } from '../../../tenant/infrastructure/persistence/estudio.schema';

export class AlertaConfigEntity {
  id!: string;
  tenant!: EstudioEntity;
  diasAnticipacion!: number;
  canalNotificacion!: string;
  activa!: boolean;
}

export const AlertaConfigSchema = new EntitySchema<AlertaConfigEntity>({
  class: AlertaConfigEntity,
  tableName: 'alerta_config',
  properties: {
    id: { type: 'uuid', primary: true },
    tenant: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'tenant_id', unique: true },
    diasAnticipacion: { type: 'number', fieldName: 'dias_anticipacion', columnType: 'int' },
    canalNotificacion: { type: 'string', fieldName: 'canal_notificacion' },
    activa: { type: 'boolean', default: true },
  },
});
