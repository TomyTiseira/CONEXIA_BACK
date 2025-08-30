import { Injectable } from '@nestjs/common';
import {
  PublicationNotFoundException,
  PublicationNotOwnerException,
} from 'src/common/exceptions/publications.exceptions';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class DeletePublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id);
    if (!publication) {
      throw new PublicationNotFoundException(id);
    }
    if (publication.userId !== userId) {
      throw new PublicationNotOwnerException();
    }
    await this.publicationRepository.softDeletePublication(id);
  }
}
