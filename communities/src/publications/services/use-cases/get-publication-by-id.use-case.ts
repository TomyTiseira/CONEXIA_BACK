import { Injectable } from '@nestjs/common';
import { PublicationNotFoundException } from 'src/common/exceptions/publications.exceptions';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class GetPublicationByIdUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(
    id: number,
    currentUserId?: number,
  ): Promise<Publication & { isOwner?: boolean }> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id);

    if (!publication) {
      throw new PublicationNotFoundException(id);
    }

    // Si se proporciona currentUserId, agregar información de si es el propietario
    if (currentUserId !== undefined) {
      return {
        ...publication,
        isOwner: publication.userId === currentUserId,
      };
    }

    return publication;
  }
}
