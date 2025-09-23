import { Publication } from '../entities/publication.entity';
import {
  MediaResponseDto,
  PublicationResponseDto,
} from '../response/publication.response';

export class PublicationTransformerHelper {
  static transformPublication(
    publication: Publication,
  ): PublicationResponseDto {
    const transformed: PublicationResponseDto = {
      id: publication.id,
      description: publication.description,
      userId: publication.userId,
      privacy: publication.privacy,
      isActive: publication.isActive,
      createdAt: publication.createdAt,
      updatedAt: publication.updatedAt,
    };

    // Priorizar el nuevo formato de media sobre los campos legacy
    if (publication.media && publication.media.length > 0) {
      // Si hay archivos en la nueva tabla, usar solo esos
      transformed.media = publication.media.map((media) =>
        PublicationTransformerHelper.transformMedia(media),
      );
      // No incluir campos legacy para evitar duplicación
    } else if (publication.mediaUrl) {
      // Solo usar campos legacy si no hay archivos en la nueva tabla
      transformed.mediaUrl = publication.mediaUrl;
      transformed.mediaFilename = publication.mediaFilename;
      transformed.mediaSize = publication.mediaSize;
      transformed.mediaType = publication.mediaType;
    }

    return transformed;
  }

  static transformMedia(media: any): MediaResponseDto {
    return {
      id: media.id,
      fileUrl: media.fileUrl,
      filename: media.filename,
      fileType: media.fileType,
      fileSize: media.fileSize,
      displayOrder: media.displayOrder,
    };
  }

  static transformPublications(
    publications: Publication[],
  ): PublicationResponseDto[] {
    return publications.map((publication) =>
      PublicationTransformerHelper.transformPublication(publication),
    );
  }
}
