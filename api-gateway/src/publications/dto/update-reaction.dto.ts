import { IsIn } from 'class-validator';

enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  SUPPORT = 'support',
  CELEBRATE = 'celebrate',
  INSIGHTFUL = 'insightful',
}

export class UpdateReactionDto {
  @IsIn(Object.values(ReactionType), {
    message: `type must be one of: ${Object.values(ReactionType).join(', ')}`,
  })
  type: ReactionType;
}
