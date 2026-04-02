import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CrearPlanDto {
  @IsString()
  @IsNotEmpty()
  codigo!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsNumber()
  @IsPositive()
  maxClientes!: number;

  @IsNumber()
  @IsPositive()
  maxUsuarios!: number;

  @IsNumber()
  precio!: number;

  @IsBoolean()
  @IsOptional()
  isPublico?: boolean;

  @IsObject()
  @IsOptional()
  condiciones?: Record<string, unknown>;
}
