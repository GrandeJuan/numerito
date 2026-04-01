import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class IniciarSesionDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
