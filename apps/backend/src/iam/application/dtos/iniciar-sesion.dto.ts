import { iniciarSesionSchema, type IniciarSesionInput } from '@numerito/shared';

export const iniciarSesionDtoSchema = iniciarSesionSchema;

export class IniciarSesionDto implements IniciarSesionInput {
  email!: string;
  password!: string;
}
