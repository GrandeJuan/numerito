import { IsNotEmpty, IsDateString } from 'class-validator';

export class RenovarSubscripcionDto {
  @IsDateString()
  @IsNotEmpty()
  nuevaFechaFin!: string;
}
