import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      throw new NotFoundException('Publication not found');
    }
    if (publication.userId !== userId) {
      throw new ForbiddenException('You are not the owner of this publication');
    }
    await this.publicationRepository.updatePublication(id, updateDto);
    const updated =
      await this.publicationRepository.findActivePublicationById(id);
    if (!updated) {
      throw new NotFoundException('Publication not found after update');
    }
    return updated;
  }
}
