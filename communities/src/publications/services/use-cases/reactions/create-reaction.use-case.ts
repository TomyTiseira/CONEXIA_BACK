import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    // Verificar que la publicación existe
    const publication =
      await this.publicationRepository.findActivePublicationById(
        data.publicationId,
      );

    if (!publication) {
      throw new NotFoundException(
        `Publication with ID ${data.publicationId} not found`,
      );
    }

    // Verificar que el usuario es el mismo que el que viene en el DTO
    if (userId !== data.userId) {
      throw new BadRequestException('User ID mismatch');
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
