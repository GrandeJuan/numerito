import { IsNumber, IsPositive, IsString, IsNotEmpty } from 'class-validator';

export class RegistrarHorasDto {
  @IsNumber()
  @IsPositive()
  horas!: number;

  @IsString()
  @IsNotEmpty()
  descripcion!: string;
}
