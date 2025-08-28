import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from '../../dto/create-publication.dto';
import { Publication } from '../../entities/publication.entity';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class CreatePublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(
    data: CreatePublicationDto,
    userId: number,
  ): Promise<Publication> {
    const publication = this.publicationRepository.create({
      description: data.description,
      mediaFilename: data.mediaFilename,
      mediaSize: data.mediaSize,
      mediaType: data.mediaType,
      mediaUrl: data.mediaUrl,
      userId,
    });

    return await this.publicationRepository.save(publication);
  }
}
