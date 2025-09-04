import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateReactionDto } from '../../../dto/update-reaction.dto';
import { PublicationReaction } from '../../../entities/publication-reaction.entity';
import { ReactionRepository } from '../../../repositories/reaction.repository';

@Injectable()
export class EditReactionUseCase {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async execute(
    id: number,
    userId: number,
    updateDto: UpdateReactionDto,
  ): Promise<PublicationReaction> {
    const reaction = await this.reactionRepository.findActiveReactionById(id);

    if (!reaction) {
      throw new NotFoundException(`Reaction with ID ${id} not found`);
    }

    // Verificar que el usuario es el dueño de la reacción
    if (reaction.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to edit this reaction',
      );
    }

    // Actualizar la reacción
    await this.reactionRepository.update(id, { type: updateDto.type });

    const updatedReaction =
      await this.reactionRepository.findActiveReactionById(id);

    if (!updatedReaction) {
      throw new NotFoundException(
        `Reaction with ID ${id} not found after update`,
      );
    }

    return updatedReaction;
  }
}
