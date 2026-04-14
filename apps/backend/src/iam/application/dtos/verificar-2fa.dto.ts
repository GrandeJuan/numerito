import { verificar2FASchema, type Verificar2FAInput } from '@numerito/shared';

export const verificar2FADtoSchema = verificar2FASchema;

export class Verificar2FADto implements Verificar2FAInput {
  code!: string;
}
