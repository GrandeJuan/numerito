import { IsNotEmpty, IsString, IsDateString, IsNumber, Min } from 'class-validator';

export class CrearEmpleadoDto {
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  apellido!: string;

  @IsString()
  @IsNotEmpty()
  cuil!: string;

  @IsDateString()
  fechaIngreso!: string;

  @IsNumber()
  @Min(1)
  sueldoBasico!: number;

  @IsString()
  @IsNotEmpty()
  categoriaConvenio!: string;
}
