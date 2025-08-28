import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class DeletePublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(id: number, userId: number): Promise<void> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id);
    if (!publication) {
      throw new NotFoundException('Publication not found');
    }
    if (publication.userId !== userId) {
      throw new ForbiddenException('You are not the owner of this publication');
    }
    await this.publicationRepository.softDeletePublication(id);
  }
}
