import { IsString, IsNumber, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class ActualizarPlanDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsOptional()
  maxClientes?: number;

  @IsNumber()
  @IsOptional()
  maxUsuarios?: number;

  @IsNumber()
  @IsOptional()
  precio?: number;

  @IsBoolean()
  @IsOptional()
  isPublico?: boolean;

  @IsObject()
  @IsOptional()
  condiciones?: Record<string, unknown>;
}
