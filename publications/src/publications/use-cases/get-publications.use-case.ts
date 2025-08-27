import { Injectable } from '@nestjs/common';
import { PublicationRepository } from '../repositories/publication.repository';

@Injectable()
export class GetPublicationsUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(): Promise<any[]> {
    return await this.publicationRepository.findActivePublications();
  }
}
