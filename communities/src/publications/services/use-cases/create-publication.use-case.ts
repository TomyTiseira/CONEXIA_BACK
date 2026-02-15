import { Inject, Injectable } from '@nestjs/common';
import { FileStorage } from '../../../common/domain/interfaces/file-storage.interface';
import { CreatePublicationDto } from '../../dto/create-publication.dto';
import { Publication } from '../../entities/publication.entity';
import { PublicationMedia } from '../../entities/publication-media.entity';
import { PublicationTransformerHelper } from '../../helpers/publication-transformer.helper';
import { PublicationMediaRepository } from '../../repositories/publication-media.repository';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class CreatePublicationUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly publicationMediaRepository: PublicationMediaRepository,
    @Inject('FILE_STORAGE') private readonly fileStorage: FileStorage,
  ) {}

  async execute(data: CreatePublicationDto, userId: number): Promise<any> {
    // Determinar si se usan archivos nuevos con base64 o legacy
    const hasBase64Files =
      data.media && data.media.length > 0 && data.media.some((m) => m.fileData);

    // Crear la publicación principal
    const publicationData: Partial<Publication> = {
      description: data.description,
      userId,
      privacy: data.privacy,
    };

    // Solo agregar campos legacy si no se usa el nuevo formato
    if (!hasBase64Files && data.mediaUrl) {
      publicationData.mediaFilename = data.mediaFilename;
      publicationData.mediaSize = data.mediaSize;
      publicationData.mediaType = data.mediaType;
      publicationData.mediaUrl = data.mediaUrl;
    }

    const publication = this.publicationRepository.create(publicationData);
    const savedPublication = await this.publicationRepository.save(publication);

    // Procesar archivos base64 del API Gateway
    if (hasBase64Files && data.media) {
      const uploadedMedia: PublicationMedia[] = [];

      for (const [index, mediaFile] of data.media.entries()) {
        if (mediaFile.fileData) {
          // Convertir base64 a buffer
          const buffer = Buffer.from(mediaFile.fileData, 'base64');

          // Generar nombre de archivo único
          const filename = this.generateFilename(
            savedPublication.id,
            mediaFile.originalName || 'file',
          );

          // Subir a storage (GCS en prod, local en dev)
          const filePath = await this.fileStorage.upload(
            buffer,
            filename,
            mediaFile.mimeType || 'image/jpeg',
          );

          // Crear entidad de media
          const mediaEntity = this.publicationMediaRepository.create({
            publicationId: savedPublication.id,
            filename: filename,
            fileUrl: filePath,
            fileType: mediaFile.mimeType || 'image/jpeg',
            fileSize: mediaFile.size || buffer.length,
            displayOrder: mediaFile.displayOrder || index + 1,
          });

          uploadedMedia.push(mediaEntity);
        }
      }

      if (uploadedMedia.length > 0) {
        await this.publicationMediaRepository.save(uploadedMedia);
      }
    }
    // Formato legacy con fileUrl ya procesada (backwards compatibility)
    else if (
      data.media &&
      data.media.length > 0 &&
      data.media.some((m) => m.fileUrl)
    ) {
      const mediaEntities = data.media.map((mediaFile, index) => {
        return this.publicationMediaRepository.create({
          publicationId: savedPublication.id,
          filename: mediaFile.filename || '',
          fileUrl: mediaFile.fileUrl || '',
          fileType: mediaFile.fileType || 'image/jpeg',
          fileSize: mediaFile.fileSize || 0,
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

  private generateFilename(
    publicationId: number,
    originalName: string,
  ): string {
    const timestamp = Date.now();
    // Sanitize extension: only allow alphanumeric characters
    const rawExtension = originalName.split('.').pop() || 'jpg';
    const extension =
      rawExtension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
    return `publication-${publicationId}-${timestamp}.${extension}`;
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
