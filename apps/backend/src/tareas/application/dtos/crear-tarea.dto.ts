import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';
import { PRIORIDAD, type Prioridad } from '@numerito/shared';

export class CrearTareaDto {
  @IsString()
  @IsNotEmpty()
  titulo!: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsString()
  @IsOptional()
  clienteId?: string;

  @IsString()
  @IsIn(Object.values(PRIORIDAD))
  prioridad!: Prioridad;
}
