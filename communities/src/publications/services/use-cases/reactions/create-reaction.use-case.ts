import { Injectable } from '@nestjs/common';
import { PublicationNotFoundException } from 'src/common/exceptions/publications.exceptions';
import { ReactionUserIdMismatchException } from 'src/common/exceptions/reactions.exceptions';
import { CreateReactionDto } from '../../../dto/create-reaction.dto';
import { PublicationReaction } from '../../../entities/publication-reaction.entity';
import { PublicationRepository } from '../../../repositories/publication.repository';
import { ReactionRepository } from '../../../repositories/reaction.repository';

@Injectable()
export class CreateReactionUseCase {
  constructor(
    private readonly reactionRepository: ReactionRepository,
    private readonly publicationRepository: PublicationRepository,
  ) {}

  async execute(
    data: CreateReactionDto,
    userId: number,
  ): Promise<PublicationReaction> {
    // Verificar que la publicación existe y el usuario tiene acceso a ella
    const publication =
      await this.publicationRepository.findActivePublicationById(
        data.publicationId,
        userId,
      );

    if (!publication) {
      throw new PublicationNotFoundException(data.publicationId);
    }

    // Verificar que el usuario es el mismo que el que viene en el DTO
    if (userId !== data.userId) {
      throw new ReactionUserIdMismatchException();
    }

    // Verificar si ya existe una reacción del usuario en esta publicación
    const existingReaction =
      await this.reactionRepository.findUserReactionToPublication(
        userId,
        data.publicationId,
      );

    // Si existe una reacción, actualizarla
    if (existingReaction) {
      existingReaction.type = data.type;
      return await this.reactionRepository.save(existingReaction);
    }

    // Crear la reacción
    const reaction = this.reactionRepository.create({
      type: data.type,
      userId: data.userId,
      publicationId: data.publicationId,
    });

    return await this.reactionRepository.save(reaction);
  }
}
