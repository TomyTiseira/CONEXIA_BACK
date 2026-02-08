import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateServiceReviewDto {
  @IsInt()
  @Min(1)
  hiringId: number;

  @IsInt()
  @Min(1)
  @Max(5, { message: 'La calificación debe estar entre 1 y 5 estrellas' })
  rating: number;

  @IsString()
  @IsNotEmpty({ message: 'El comentario no puede estar vacío' })
  comment: string;
}
