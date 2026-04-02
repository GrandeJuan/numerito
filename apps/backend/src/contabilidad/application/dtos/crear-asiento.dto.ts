import { IsNotEmpty, IsString, IsArray, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LineaAsientoDto {
  @IsString()
  @IsNotEmpty()
  cuentaId!: string;

  @IsNotEmpty()
  debe!: number;

  @IsNotEmpty()
  haber!: number;

  @IsString()
  descripcion!: string;
}

export class CrearAsientoDto {
  @IsString()
  @IsNotEmpty()
  libroId!: string;

  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @IsDateString()
  fecha!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LineaAsientoDto)
  lineas!: LineaAsientoDto[];
}
