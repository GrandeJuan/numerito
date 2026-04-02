import { IsNotEmpty, IsString } from 'class-validator';

export class RubricarLibroDto {
  @IsString()
  @IsNotEmpty()
  numeroRubrica!: string;
}
