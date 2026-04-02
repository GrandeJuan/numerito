import { EntitySchema } from '@mikro-orm/core';
import { PlanEntity } from '../../../shared/infrastructure/persistence/plan.schema';

export class EstudioEntity {
  id!: string;
  nombre!: string;
  plan!: PlanEntity;
  cuit!: string;
  isActive!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export const EstudioSchema = new EntitySchema<EstudioEntity>({
  class: EstudioEntity,
  tableName: 'estudio',
  properties: {
    id: { type: 'uuid', primary: true },
    nombre: { type: 'string' },
    plan: { kind: 'm:1', entity: () => PlanEntity, fieldName: 'plan_id' },
    cuit: { type: 'string', length: 13, unique: true },
    isActive: { type: 'boolean', fieldName: 'is_active', default: true },
    createdAt: { type: 'Date', fieldName: 'created_at', onCreate: () => new Date() },
    updatedAt: { type: 'Date', fieldName: 'updated_at', onCreate: () => new Date(), onUpdate: () => new Date() },
  },
});
