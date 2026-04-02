import { ValueObject } from '../../../shared/domain';

export const PLAN = {
  FREE: 'FREE',
  PROFESIONAL: 'PROFESIONAL',
  ENTERPRISE: 'ENTERPRISE',
} as const;

export type Plan = (typeof PLAN)[keyof typeof PLAN];

interface PlanSubscripcionProps {
  value: Plan;
  maxClientes: number;
  maxUsuarios: number;
}

export class PlanSubscripcion extends ValueObject<PlanSubscripcionProps> {
  get value(): Plan {
    return this.props.value;
  }

  get maxClientes(): number {
    return this.props.maxClientes;
  }

  get maxUsuarios(): number {
    return this.props.maxUsuarios;
  }

  static create(plan: Plan, maxClientes: number, maxUsuarios: number): PlanSubscripcion {
    return new PlanSubscripcion({ value: plan, maxClientes, maxUsuarios });
  }
}
