import { actualizarEstudioSchema, type ActualizarEstudioInput } from '@numerito/shared';

export const actualizarEstudioDtoSchema = actualizarEstudioSchema;

export class ActualizarEstudioDto implements ActualizarEstudioInput {
  nombre?: string;
}
