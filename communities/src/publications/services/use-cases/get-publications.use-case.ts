import { Injectable } from '@nestjs/common';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class GetPublicationsUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(currentUserId: number): Promise<(Publication & { isOwner: boolean })[]> {
    const publications = await this.publicationRepository.findActivePublications();
    return publications.map(pub => ({
      ...pub,
      isOwner: pub.userId === currentUserId,
    }));
  }
}
