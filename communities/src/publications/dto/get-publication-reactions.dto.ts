import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  SUPPORT = 'support',
  CELEBRATE = 'celebrate',
  INSIGHTFUL = 'insightful',
  FUN = 'fun',
}

export class GetPublicationReactionsDto {
  @IsNotEmpty({ message: 'publicationId is required' })
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;

  @IsOptional()
  @IsNumber({}, { message: 'currentUserId must be a number' })
  currentUserId?: number;

  @IsOptional()
  @IsEnum(ReactionType, { message: 'type must be a valid reaction type' })
  type?: string;

  page?: number;
  limit?: number;
}
