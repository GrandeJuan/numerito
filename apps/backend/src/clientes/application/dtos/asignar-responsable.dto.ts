import { asignarResponsableSchema, type AsignarResponsableInput } from '@numerito/shared';

export const asignarResponsableDtoSchema = asignarResponsableSchema;

export class AsignarResponsableDto implements AsignarResponsableInput {
  responsableId!: string;
}
