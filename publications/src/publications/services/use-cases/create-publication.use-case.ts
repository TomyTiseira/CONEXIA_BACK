import { Injectable } from '@nestjs/common';
import { PublicationRepository } from '../../repositories/publication.repository';

export interface CreatePublicationDto {
  description: string;
  imageFilename?: string;
  imageSize?: number;
}

@Injectable()
export class CreatePublicationUseCase {
  constructor(private readonly publicationRepository: PublicationRepository) {}

  async execute(data: CreatePublicationDto): Promise<any> {
    const publication = this.publicationRepository.create({
      description: data.description,
      imageFilename: data.imageFilename,
      imageSize: data.imageSize,
    });

    return await this.publicationRepository.save(publication);
  }
}
