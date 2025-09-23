import { Injectable } from '@nestjs/common';
import {
  PublicationNotFoundException,
  PublicationNotOwnerException,
} from 'src/common/exceptions/publications.exceptions';
import { PublicationMediaRepository } from '../../repositories/publication-media.repository';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class DeletePublicationUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly publicationMediaRepository: PublicationMediaRepository,
  ) {}

  async execute(id: number, userId: number): Promise<void> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id, userId);
    if (!publication) {
      throw new PublicationNotFoundException(id);
    }
    if (publication.userId !== userId) {
      throw new PublicationNotOwnerException();
    }

    // Eliminar archivos asociados antes de eliminar la publicación
    await this.publicationMediaRepository.deleteByPublicationId(id);

    // Soft delete de la publicación
    await this.publicationRepository.softDeletePublication(id);
  }
}
