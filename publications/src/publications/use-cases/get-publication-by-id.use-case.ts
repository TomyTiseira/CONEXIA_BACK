import { Injectable } from '@nestjs/common';
import { Publication } from '../entities/publication.entity';
import { PublicationRepository } from '../repositories/publication.repository';

@Injectable()
export class GetPublicationByIdUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(id: number): Promise<Publication | null> {
    return await this.publicationRepository.findActivePublicationById(id);
  }
}
