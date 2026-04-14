import { solicitarResetPasswordSchema, type SolicitarResetPasswordInput } from '@numerito/shared';

export const solicitarResetPasswordDtoSchema = solicitarResetPasswordSchema;

export class SolicitarResetPasswordDto implements SolicitarResetPasswordInput {
  email!: string;
}
