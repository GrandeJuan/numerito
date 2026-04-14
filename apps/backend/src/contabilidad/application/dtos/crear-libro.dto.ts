import { crearLibroSchema, type CrearLibroInput } from '@numerito/shared';

export const crearLibroDtoSchema = crearLibroSchema;

export class CrearLibroDto implements CrearLibroInput {
  clienteId!: string;
  tipo!: string;
  periodo!: string;
}
