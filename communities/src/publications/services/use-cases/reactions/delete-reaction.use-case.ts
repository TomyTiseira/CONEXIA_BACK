import { Injectable } from '@nestjs/common';
import {
  ReactionNotFoundException,
  ReactionNotOwnerException,
} from 'src/common/exceptions/reactions.exceptions';
import { ReactionRepository } from '../../../repositories/reaction.repository';

@Injectable()
export class DeleteReactionUseCase {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const reaction = await this.reactionRepository.findActiveReactionById(id);

    if (!reaction) {
      throw new ReactionNotFoundException(id);
    }

    // Verificar que el usuario es el dueño de la reacción
    if (reaction.userId !== userId) {
      throw new ReactionNotOwnerException();
    }

    // Eliminar lógicamente la reacción
    await this.reactionRepository.softDelete(id);
  }
}
