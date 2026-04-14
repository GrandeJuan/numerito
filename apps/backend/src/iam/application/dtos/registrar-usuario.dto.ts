import { registrarUsuarioSchema, type RegistrarUsuarioInput } from '@numerito/shared';

export const registrarUsuarioDtoSchema = registrarUsuarioSchema;

export class RegistrarUsuarioDto implements RegistrarUsuarioInput {
  email!: string;
  password!: string;
  nombre!: string;
  apellido!: string;
  rol!: string;
}
