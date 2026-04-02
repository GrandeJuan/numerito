import { IsOptional, IsString, MinLength } from 'class-validator';

export class ActualizarEstudioDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  nombre?: string;
}
