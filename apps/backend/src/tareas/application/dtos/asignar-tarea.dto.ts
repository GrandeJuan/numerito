import { IsString, IsNotEmpty } from 'class-validator';

export class AsignarTareaDto {
  @IsString()
  @IsNotEmpty()
  responsableId!: string;
}
