import { Injectable } from '@nestjs/common';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class GetUserPublicationsUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(userId: number): Promise<Publication[]> {
    return await this.publicationRepository.findPublicationsByUser(userId);
  }
}
