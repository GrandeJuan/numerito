import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetearPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(8)
  newPassword!: string;
}
