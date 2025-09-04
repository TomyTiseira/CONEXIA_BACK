import { IsIn, IsNotEmpty, IsNumber } from 'class-validator';
import { ReactionType } from '../entities/publication-reaction.entity';

export class CreateReactionDto {
  @IsNotEmpty({ message: 'type is required' })
  @IsIn(Object.values(ReactionType), {
    message: `type must be one of: ${Object.values(ReactionType).join(', ')}`,
  })
  type: ReactionType;

  @IsNotEmpty({ message: 'userId is required' })
  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;

  @IsNotEmpty({ message: 'publicationId is required' })
  @IsNumber({}, { message: 'publicationId must be a number' })
  publicationId: number;
}
