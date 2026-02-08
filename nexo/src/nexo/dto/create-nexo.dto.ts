import { IsNotEmpty, IsString } from 'class-validator';

export class CreateNexoDto {
  @IsNotEmpty()
  @IsString()
  question: string;

  @IsNotEmpty()
  @IsString()
  answer: string;
}
