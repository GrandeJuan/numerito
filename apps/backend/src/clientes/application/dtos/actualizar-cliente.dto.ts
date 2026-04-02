import { IsOptional, IsString, MinLength } from 'class-validator';

export class ActualizarClienteDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  razonSocial?: string;

  @IsOptional()
  @IsString()
  condicionIva?: string;

  @IsOptional()
  @IsString()
  regimen?: string;
}
