import { registrarHorasSchema, type RegistrarHorasInput } from '@numerito/shared';

export const registrarHorasDtoSchema = registrarHorasSchema;

export class RegistrarHorasDto implements RegistrarHorasInput {
  horas!: number;
  descripcion!: string;
}
