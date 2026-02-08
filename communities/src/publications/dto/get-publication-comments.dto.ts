import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class GetPublicationCommentsDto {
  @IsNotEmpty({ message: 'publicationId is required' })
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;

  @IsOptional()
  @IsNumber({}, { message: 'currentUserId must be a number' })
  currentUserId?: number;

  page?: number;
  limit?: number;
}
