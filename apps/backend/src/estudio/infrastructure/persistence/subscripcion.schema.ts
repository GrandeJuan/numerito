import { EntitySchema } from '@mikro-orm/core';
import { EstudioEntity } from './estudio.schema';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';
import { EstadoSubscripcionEntity } from '../../../shared/infrastructure/persistence/estado-subscripcion.schema';
import { CicloFacturacionEntity } from '../../../shared/infrastructure/persistence/ciclo-facturacion.schema';

export class SubscripcionEntity {
  id!: string;
  estudio!: EstudioEntity;
  plan!: PlanEntity;
  estadoSubscripcion!: EstadoSubscripcionEntity;
  cicloFacturacion!: CicloFacturacionEntity;
  fechaInicio!: Date;
  fechaFin!: Date;
  autoRenovacion!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const SubscripcionSchema = new EntitySchema<SubscripcionEntity>({
  class: SubscripcionEntity,
  tableName: 'subscripcion',
  properties: {
    id: { type: 'uuid', primary: true },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    plan: { kind: 'm:1', entity: () => PlanEntity, fieldName: 'plan_id' },
    estadoSubscripcion: { kind: 'm:1', entity: () => EstadoSubscripcionEntity, fieldName: 'estado_subscripcion_id' },
    cicloFacturacion: { kind: 'm:1', entity: () => CicloFacturacionEntity, fieldName: 'ciclo_facturacion_id' },
    fechaInicio: { type: 'Date', fieldName: 'fecha_inicio' },
    fechaFin: { type: 'Date', fieldName: 'fecha_fin' },
    autoRenovacion: { type: 'boolean', fieldName: 'auto_renovacion', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
});
