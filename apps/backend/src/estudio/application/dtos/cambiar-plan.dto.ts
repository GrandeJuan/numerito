import { cambiarPlanSchema, type CambiarPlanInput } from '@numerito/shared';

export const cambiarPlanDtoSchema = cambiarPlanSchema;

export class CambiarPlanDto implements CambiarPlanInput {
  planId!: string;
}
