import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum CommentSortType {
  RECENT = 'recent',
  RELEVANCE = 'relevance',
}

export class GetPublicationCommentsDto {
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;

  @IsOptional()
  @IsNumber({}, { message: 'currentUserId must be a number' })
  currentUserId?: number;

  @IsOptional()
  @IsEnum(CommentSortType, {
    message: 'sort must be either recent or relevance',
  })
  sort?: CommentSortType = CommentSortType.RECENT;

  @IsOptional()
  @IsNumber({}, { message: 'page must be a number' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'limit must be a number' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number;
}
