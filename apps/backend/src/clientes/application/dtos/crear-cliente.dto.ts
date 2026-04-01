import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CrearClienteDto {
  @IsString()
  @IsNotEmpty()
  cuit: string;

  @IsString()
  @MinLength(3)
  razonSocial: string;

  @IsString()
  @IsNotEmpty()
  condicionIva: string;

  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  regimen: string;
}
