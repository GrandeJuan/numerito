import type { Plan } from '../value-objects/plan-subscripcion.vo';
import { PlanSubscripcion } from '../value-objects/plan-subscripcion.vo';

export interface PlanData {
  plan: Plan;
  maxClientes: number;
  maxUsuarios: number;
  precio: number;
}

export interface PlanRepository {
  findByPlan(plan: Plan): Promise<PlanData | null>;
  findAll(): Promise<PlanData[]>;
  save(data: PlanData): Promise<void>;
}

export const PLAN_REPOSITORY = Symbol('PlanRepository');
