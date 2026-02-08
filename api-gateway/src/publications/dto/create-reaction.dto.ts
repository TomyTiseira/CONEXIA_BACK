import { IsIn, IsNotEmpty } from 'class-validator';

enum ReactionType {
  LIKE = 'like',
  LOVE = 'love',
  SUPPORT = 'support',
  CELEBRATE = 'celebrate',
  INSIGHTFUL = 'insightful',
  FUN = 'fun',
}

export class CreateReactionDto {
  @IsNotEmpty({ message: 'type is required' })
  @IsIn(Object.values(ReactionType), {
    message: `type must be one of: ${Object.values(ReactionType).join(', ')}`,
  })
  type: ReactionType;
}
