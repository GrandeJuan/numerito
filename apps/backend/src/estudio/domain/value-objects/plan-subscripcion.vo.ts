import { ValueObject } from '../../../shared/domain';
import { PLAN } from '@numerito/shared';
import type { Plan } from '@numerito/shared';

export { PLAN };
export type { Plan };

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
