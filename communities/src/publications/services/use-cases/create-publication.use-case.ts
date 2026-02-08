import { Injectable } from '@nestjs/common';
import { CreatePublicationDto } from '../../dto/create-publication.dto';
import { Publication } from '../../entities/publication.entity';
import { PublicationTransformerHelper } from '../../helpers/publication-transformer.helper';
import { PublicationMediaRepository } from '../../repositories/publication-media.repository';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class CreatePublicationUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly publicationMediaRepository: PublicationMediaRepository,
  ) {}

  async execute(data: CreatePublicationDto, userId: number): Promise<any> {
    // Determinar si se usan archivos nuevos o legacy
    const useNewMediaFormat = data.media && data.media.length > 0;

    // Crear la publicación principal
    const publicationData: Partial<Publication> = {
      description: data.description,
      userId,
      privacy: data.privacy,
    };

    // Solo agregar campos legacy si no se usa el nuevo formato
    if (!useNewMediaFormat) {
      publicationData.mediaFilename = data.mediaFilename;
      publicationData.mediaSize = data.mediaSize;
      publicationData.mediaType = data.mediaType;
      publicationData.mediaUrl = data.mediaUrl;
    }

    const publication = this.publicationRepository.create(publicationData);
    const savedPublication = await this.publicationRepository.save(publication);

    // Si hay archivos en el nuevo formato, guardarlos en la tabla de media
    if (useNewMediaFormat && data.media) {
      const mediaEntities = data.media.map((mediaFile, index) => {
        return this.publicationMediaRepository.create({
          publicationId: savedPublication.id,
          filename: mediaFile.filename,
          fileUrl: mediaFile.fileUrl,
          fileType: mediaFile.fileType,
          fileSize: mediaFile.fileSize,
          displayOrder: mediaFile.displayOrder || index + 1,
        });
      });

      await this.publicationMediaRepository.save(mediaEntities);
    }
    // Si no hay archivos nuevos pero hay archivos legacy, crear entrada en media para consistencia
    else if (data.mediaUrl && data.mediaFilename) {
      const legacyMedia = this.publicationMediaRepository.create({
        publicationId: savedPublication.id,
        filename: data.mediaFilename,
        fileUrl: data.mediaUrl,
        fileType: this.getLegacyMimeType(data.mediaType),
        fileSize: data.mediaSize || 0,
        displayOrder: 1,
      });

      await this.publicationMediaRepository.save(legacyMedia);
    }

    // Obtener la publicación con sus relaciones para transformarla
    const publicationWithRelations = await this.publicationRepository.findOne({
      where: { id: savedPublication.id },
      relations: ['media'],
    });

    if (!publicationWithRelations) {
      return savedPublication;
    }

    // Aplicar transformer para evitar duplicación de datos
    return PublicationTransformerHelper.transformPublication(
      publicationWithRelations,
    );
  }

  private getLegacyMimeType(mediaType?: string): string {
    switch (mediaType) {
      case 'image':
        return 'image/jpeg';
      case 'video':
        return 'video/mp4';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  }
}
