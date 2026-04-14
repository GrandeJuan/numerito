import { actualizarPlanSchema, type ActualizarPlanInput } from '@numerito/shared';

export const actualizarPlanDtoSchema = actualizarPlanSchema;

export class ActualizarPlanDto implements ActualizarPlanInput {
  nombre?: string;
  descripcion?: string;
  maxClientes?: number;
  maxUsuarios?: number;
  precio?: number;
  isPublico?: boolean;
  condiciones?: Record<string, unknown>;
}
