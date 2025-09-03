import { IsNotEmpty, IsNumber } from 'class-validator';

export class GetPublicationCommentsDto {
  @IsNotEmpty({ message: 'publicationId is required' })
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;

  page?: number;
  limit?: number;
}
