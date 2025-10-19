import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class AddObservationsDto {
  @IsNotEmpty({ message: 'Las observaciones son obligatorias' })
  @IsString({ message: 'Las observaciones deben ser un texto' })
  @MinLength(20, {
    message: 'Las observaciones deben tener al menos 20 caracteres',
  })
  @MaxLength(2000, {
    message: 'Las observaciones no pueden exceder los 2000 caracteres',
  })
  observations: string;
}
