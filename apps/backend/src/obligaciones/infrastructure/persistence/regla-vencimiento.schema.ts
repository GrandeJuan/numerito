import { EntitySchema } from '@mikro-orm/core';
import { TipoObligacionEntity } from '../../../shared/infrastructure/persistence/tipo-obligacion.schema';

export class ReglaVencimientoEntity {
  id!: number;
  tipoObligacion!: TipoObligacionEntity;
  terminacionCuit!: string;
  diaVencimiento!: number;
  mesSiguiente!: boolean;
  jurisdiccion!: string;
  regimen!: string;
  vigenciaDesde!: Date;
  vigenciaHasta!: Date | null;
  origen!: string;
  estado!: string;
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
    jurisdiccion: { type: 'string', default: 'ARCA' },
    regimen: { type: 'string', default: 'GENERAL' },
    vigenciaDesde: { type: 'Date', fieldName: 'vigencia_desde', default: '2026-01-01' },
    vigenciaHasta: { type: 'Date', fieldName: 'vigencia_hasta', nullable: true },
    origen: { type: 'string', default: 'MANUAL' },
    estado: { type: 'string', default: 'ACTIVA' },
  },
});
