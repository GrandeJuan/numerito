import { IsNumber, Min, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegistrarPagoDto {
  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  monto!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  medioPagoId!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referencia?: string;
}
