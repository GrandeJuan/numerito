import { actualizarSueldoSchema, type ActualizarSueldoInput } from '@numerito/shared';

export const actualizarSueldoDtoSchema = actualizarSueldoSchema;

export class ActualizarSueldoDto implements ActualizarSueldoInput {
  sueldo!: number;
}
