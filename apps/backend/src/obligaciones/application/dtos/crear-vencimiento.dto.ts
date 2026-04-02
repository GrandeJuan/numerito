import { IsNotEmpty, IsString, IsDateString } from 'class-validator';

export class CrearVencimientoDto {
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @IsString()
  @IsNotEmpty()
  tipoObligacion!: string;

  @IsString()
  @IsNotEmpty()
  periodo!: string;

  @IsDateString()
  fechaVencimiento!: string;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;
}
