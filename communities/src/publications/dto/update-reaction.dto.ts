import { IsIn } from 'class-validator';
import { ReactionType } from '../entities/publication-reaction.entity';

export class UpdateReactionDto {
  @IsIn(Object.values(ReactionType), {
    message: `type must be one of: ${Object.values(ReactionType).join(', ')}`,
  })
  type: ReactionType;
}
