import { IsString, IsNotEmpty, IsNumber, IsPositive, IsIn } from 'class-validator';
import { TIPO_DOCUMENTO, type TipoDocumento } from '@numerito/shared';

export class CrearDocumentoDto {
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @IsString()
  @IsIn(Object.values(TIPO_DOCUMENTO))
  tipo!: TipoDocumento;

  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @IsString()
  @IsNotEmpty()
  s3Key!: string;

  @IsString()
  @IsNotEmpty()
  mimeType!: string;

  @IsNumber()
  @IsPositive()
  sizeBytes!: number;
}
