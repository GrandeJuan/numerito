import { IsString, IsDateString, IsArray, ValidateNested, IsNumber, Min, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LineaFacturaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  descripcion!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  cantidad!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  precioUnitario!: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  alicuotaIva!: number;
}

export class CrearFacturaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  numero!: string;

  @ApiProperty()
  @IsDateString()
  fechaEmision!: string;

  @ApiProperty()
  @IsDateString()
  fechaVencimiento!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concepto!: string;

  @ApiProperty({ type: [LineaFacturaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaFacturaDto)
  lineas!: LineaFacturaDto[];
}
