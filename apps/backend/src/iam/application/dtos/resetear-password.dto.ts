import { resetearPasswordSchema, type ResetearPasswordInput } from '@numerito/shared';

export const resetearPasswordDtoSchema = resetearPasswordSchema;

export class ResetearPasswordDto implements ResetearPasswordInput {
  token!: string;
  newPassword!: string;
}
