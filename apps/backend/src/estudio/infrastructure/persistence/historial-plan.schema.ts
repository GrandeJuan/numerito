import { EntitySchema } from '@mikro-orm/core';
import { EstudioEntity } from './estudio.schema';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';

export class HistorialPlanEntity {
  id!: string;
  estudio!: EstudioEntity;
  planAnterior!: PlanEntity;
  planNuevo!: PlanEntity;
  fechaCambio!: Date;
  motivo?: string;
}

export const HistorialPlanSchema = new EntitySchema<HistorialPlanEntity>({
  class: HistorialPlanEntity,
  tableName: 'historial_plan',
  properties: {
    id: { type: 'uuid', primary: true },
    estudio: { kind: 'm:1', entity: () => EstudioEntity, fieldName: 'estudio_id' },
    planAnterior: { kind: 'm:1', entity: () => PlanEntity, fieldName: 'plan_anterior_id' },
    planNuevo: { kind: 'm:1', entity: () => PlanEntity, fieldName: 'plan_nuevo_id' },
    fechaCambio: { type: 'Date', fieldName: 'fecha_cambio', onCreate: () => new Date() },
    motivo: { type: 'string', nullable: true },
  },
});
