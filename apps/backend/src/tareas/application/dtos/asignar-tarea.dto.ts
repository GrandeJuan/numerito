import { asignarTareaSchema, type AsignarTareaInput } from '@numerito/shared';

export const asignarTareaDtoSchema = asignarTareaSchema;

export class AsignarTareaDto implements AsignarTareaInput {
  responsableId!: string;
}
