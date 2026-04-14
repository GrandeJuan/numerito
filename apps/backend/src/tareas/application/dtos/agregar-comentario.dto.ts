import { agregarComentarioSchema, type AgregarComentarioInput } from '@numerito/shared';

export const agregarComentarioDtoSchema = agregarComentarioSchema;

export class AgregarComentarioDto implements AgregarComentarioInput {
  autorId!: string;
  texto!: string;
}
