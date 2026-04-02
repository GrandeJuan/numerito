import { IsNumber, Min } from 'class-validator';

export class ActualizarSueldoDto {
  @IsNumber()
  @Min(1)
  sueldo!: number;
}
