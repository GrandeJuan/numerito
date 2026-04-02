import { IsNotEmpty, IsString } from 'class-validator';

export class CambiarPlanDto {
  @IsString()
  @IsNotEmpty()
  planId!: string;
}
