import { crearPlanSchema, type CrearPlanInput } from '@numerito/shared';

export const crearPlanDtoSchema = crearPlanSchema;

export class CrearPlanDto implements CrearPlanInput {
  codigo!: string;
  nombre!: string;
  descripcion?: string;
  maxClientes!: number;
  maxUsuarios!: number;
  precio!: number;
  isPublico?: boolean;
  condiciones?: Record<string, unknown>;
}
