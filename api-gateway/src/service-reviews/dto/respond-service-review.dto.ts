import { IsNotEmpty, IsString } from 'class-validator';

export class RespondServiceReviewDto {
  @IsString()
  @IsNotEmpty({ message: 'La respuesta no puede estar vacía' })
  ownerResponse: string;
}
