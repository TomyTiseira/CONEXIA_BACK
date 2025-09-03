import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ReactionRepository } from '../../../repositories/reaction.repository';

@Injectable()
export class DeleteReactionUseCase {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const reaction = await this.reactionRepository.findActiveReactionById(id);

    if (!reaction) {
      throw new NotFoundException(`Reaction with ID ${id} not found`);
    }

    // Verificar que el usuario es el dueño de la reacción
    if (reaction.userId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to delete this reaction',
      );
    }

    // Eliminar lógicamente la reacción
    await this.reactionRepository.softDelete(id);
  }
}
