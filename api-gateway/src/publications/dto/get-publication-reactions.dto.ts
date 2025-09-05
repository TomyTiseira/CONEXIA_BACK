import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  SUPPORT = 'support',
  CELEBRATE = 'celebrate',
  INSIGHTFUL = 'insightful',
  FUN = 'fun',
}

export class GetPublicationReactionsDto {
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;

  @IsOptional()
  @IsNumber({}, { message: 'currentUserId must be a number' })
  currentUserId?: number;

  @IsOptional()
  @IsEnum(ReactionType, { message: 'type must be a valid reaction type' })
  type?: ReactionType;

  @IsOptional()
  @IsNumber({}, { message: 'page must be a number' })
  @Min(1, { message: 'page must be at least 1' })
  page?: number;

  @IsOptional()
  @IsNumber({}, { message: 'limit must be a number' })
  @Min(1, { message: 'limit must be at least 1' })
  limit?: number;
}
