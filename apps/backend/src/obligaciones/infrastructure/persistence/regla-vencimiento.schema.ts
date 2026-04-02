import { EntitySchema } from '@mikro-orm/core';
import { TipoObligacionEntity } from '../../../shared/infrastructure/persistence/tipo-obligacion.schema';

export class ReglaVencimientoEntity {
  id!: number;
  tipoObligacion!: TipoObligacionEntity;
  terminacionCuit!: string;
  diaVencimiento!: number;
  mesSiguiente!: boolean;
}

export const ReglaVencimientoSchema = new EntitySchema<ReglaVencimientoEntity>({
  class: ReglaVencimientoEntity,
  tableName: 'regla_vencimiento',
  properties: {
    id: { type: 'number', primary: true, autoincrement: true },
    tipoObligacion: { kind: 'm:1', entity: () => TipoObligacionEntity, fieldName: 'tipo_obligacion_id' },
    terminacionCuit: { type: 'string', fieldName: 'terminacion_cuit', columnType: 'char(1)' },
    diaVencimiento: { type: 'number', fieldName: 'dia_vencimiento', columnType: 'int' },
    mesSiguiente: { type: 'boolean', fieldName: 'mes_siguiente' },
  },
});
