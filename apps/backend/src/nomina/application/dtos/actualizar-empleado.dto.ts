import { IsOptional, IsString } from 'class-validator';

export class ActualizarEmpleadoDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  apellido?: string;

  @IsString()
  @IsOptional()
  categoriaConvenio?: string;
}
