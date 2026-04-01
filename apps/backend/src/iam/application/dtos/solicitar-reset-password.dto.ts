import { IsEmail } from 'class-validator';

export class SolicitarResetPasswordDto {
  @IsEmail()
  email: string;
}
