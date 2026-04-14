import { rubricarLibroSchema, type RubricarLibroInput } from '@numerito/shared';

export const rubricarLibroDtoSchema = rubricarLibroSchema;

export class RubricarLibroDto implements RubricarLibroInput {
  numeroRubrica!: string;
}
