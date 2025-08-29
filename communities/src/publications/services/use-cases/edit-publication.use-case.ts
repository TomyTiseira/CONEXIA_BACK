import { Injectable } from '@nestjs/common';
import {
  PublicationNotFoundException,
  PublicationNotOwnerException,
} from 'src/common/exceptions/publications.exceptions';
import { UpdatePublicationDto } from '../../dto/update-publication.dto';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class EditPublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(
    id: number,
    userId: number,
    updateDto: UpdatePublicationDto,
  ): Promise<Publication> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id);

    if (!publication) {
      throw new PublicationNotFoundException(id);
    }

    if (publication.userId !== userId) {
      throw new PublicationNotOwnerException();
    }

    await this.publicationRepository.updatePublication(id, updateDto);
    const updated =
      await this.publicationRepository.findActivePublicationById(id);

    if (!updated) {
      throw new PublicationNotFoundException(id);
    }

    return updated;
  }
}
