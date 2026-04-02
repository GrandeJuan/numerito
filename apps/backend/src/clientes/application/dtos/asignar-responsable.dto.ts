import { IsNotEmpty, IsString } from 'class-validator';

export class AsignarResponsableDto {
  @IsString()
  @IsNotEmpty()
  responsableId!: string;
}
