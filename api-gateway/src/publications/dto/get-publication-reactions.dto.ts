import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetPublicationReactionsDto {
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;

  @IsOptional()
  @IsNumber({}, { message: 'page must be a number' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'limit must be a number' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number;
}
