import { IsString, IsNotEmpty } from 'class-validator';

export class AgregarComentarioDto {
  @IsString()
  @IsNotEmpty()
  autorId!: string;

  @IsString()
  @IsNotEmpty()
  texto!: string;
}
