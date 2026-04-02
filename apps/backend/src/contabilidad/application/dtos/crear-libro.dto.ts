import { IsNotEmpty, IsString } from 'class-validator';

export class CrearLibroDto {
  @IsString()
  @IsNotEmpty()
  clienteId!: string;

  @IsString()
  @IsNotEmpty()
  tipo!: string;

  @IsString()
  @IsNotEmpty()
  periodo!: string;
}
