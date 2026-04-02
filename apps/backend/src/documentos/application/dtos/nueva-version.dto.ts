import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class NuevaVersionDto {
  @IsString()
  @IsNotEmpty()
  s3Key!: string;

  @IsNumber()
  @IsPositive()
  sizeBytes!: number;
}
