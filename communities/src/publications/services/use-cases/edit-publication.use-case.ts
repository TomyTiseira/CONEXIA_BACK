import { Inject, Injectable } from '@nestjs/common';
import { FileStorage } from '../../../common/domain/interfaces/file-storage.interface';
import {
  PublicationNotFoundException,
  PublicationNotOwnerException,
} from 'src/common/exceptions/publications.exceptions';
import { UpdatePublicationDto } from '../../dto/update-publication.dto';
import { PublicationMedia } from '../../entities/publication-media.entity';
import { PublicationTransformerHelper } from '../../helpers/publication-transformer.helper';
import { PublicationMediaRepository } from '../../repositories/publication-media.repository';
import { PublicationRepository } from '../../repositories/publication.repository';

@Injectable()
export class EditPublicationUseCase {
  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly publicationMediaRepository: PublicationMediaRepository,
    @Inject('FILE_STORAGE') private readonly fileStorage: FileStorage,
  ) {}

  async execute(
    id: number,
    userId: number,
    updateDto: Partial<UpdatePublicationDto>,
  ): Promise<any> {
    const publication =
      await this.publicationRepository.findActivePublicationById(id, userId);

    if (!publication) {
      throw new PublicationNotFoundException(id);
    }

    if (publication.userId !== userId) {
      throw new PublicationNotOwnerException();
    }

    // Preparar datos para actualizar la publicación principal
    const dataToUpdate: Partial<UpdatePublicationDto> = { ...updateDto };

    // Manejar eliminación de archivos específicos por ID
    if (updateDto.removeMediaIds && updateDto.removeMediaIds.length > 0) {
      for (const mediaId of updateDto.removeMediaIds) {
        await this.publicationMediaRepository.delete({
          id: mediaId,
          publicationId: id,
        });
      }
      delete dataToUpdate.removeMediaIds;
    }

    // Manejar eliminación completa de archivos (legacy)
    if (updateDto.removeMedia === true) {
      await this.publicationMediaRepository.deleteByPublicationId(id);
      // Limpiar campos legacy cuando se eliminen todos los archivos
      dataToUpdate.mediaUrl = undefined;
      dataToUpdate.mediaFilename = undefined;
      dataToUpdate.mediaSize = undefined;
      dataToUpdate.mediaType = undefined;
      delete dataToUpdate.removeMedia;
    } else if (updateDto.removeMedia === false) {
      delete dataToUpdate.removeMedia;
    }

    // Manejar adición de nuevos archivos
    if (updateDto.media && updateDto.media.length > 0) {
      // Obtener archivos existentes para validar límites
      const existingMedia =
        await this.publicationMediaRepository.findByPublicationId(id);
      const totalFiles = existingMedia.length + updateDto.media.length;

      if (totalFiles > 5) {
        throw new Error('Maximum 5 files allowed per publication');
      }

      // Validar máximo 1 video total
      const existingVideos = existingMedia.filter((m) =>
        m.fileType?.startsWith('video/'),
      );
      const newVideos = updateDto.media.filter((m) =>
        (m.fileType || m.mimeType)?.startsWith('video/'),
      );

      if (existingVideos.length + newVideos.length > 1) {
        throw new Error('Maximum 1 video file allowed per publication');
      }

      // Encontrar el displayOrder más alto para los nuevos archivos
      const maxOrder =
        existingMedia.length > 0
          ? Math.max(...existingMedia.map((m) => m.displayOrder))
          : 0;

      // Procesar archivos - distinguir entre base64 y URLs ya procesadas
      const mediaEntities: PublicationMedia[] = [];

      for (const [index, mediaFile] of updateDto.media.entries()) {
        let fileUrl: string;
        let filename: string;
        let fileType: string;
        let fileSize: number;

        // Si tiene fileData (base64), procesarlo y subirlo
        if (mediaFile.fileData) {
          const buffer = Buffer.from(mediaFile.fileData, 'base64');
          filename = this.generateFilename(
            id,
            mediaFile.originalName || 'file',
          );
          fileUrl = await this.fileStorage.upload(
            buffer,
            filename,
            mediaFile.mimeType || 'image/jpeg',
          );
          fileType = mediaFile.mimeType || 'image/jpeg';
          fileSize = mediaFile.size || buffer.length;
        }
        // Si tiene fileUrl (ya procesado/legacy), usarlo directamente
        else if (mediaFile.fileUrl) {
          fileUrl = mediaFile.fileUrl;
          filename = mediaFile.filename || '';
          fileType = mediaFile.fileType || 'image/jpeg';
          fileSize = mediaFile.fileSize || 0;
        }
        // Si no tiene ni fileData ni fileUrl, saltar
        else {
          continue;
        }

        const mediaEntity = this.publicationMediaRepository.create({
          publicationId: id,
          filename,
          fileUrl,
          fileType,
          fileSize,
          displayOrder: maxOrder + index + 1,
        });

        mediaEntities.push(mediaEntity);
      }

      if (mediaEntities.length > 0) {
        await this.publicationMediaRepository.save(mediaEntities);
      }
      delete dataToUpdate.media;
    }

    // Actualizar la publicación principal (descripción, privacidad, etc.)
    // Excluir campos que ya fueron procesados
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { media, removeMediaIds, ...restDataToUpdate } = dataToUpdate;
    if (Object.keys(restDataToUpdate).length > 0) {
      await this.publicationRepository.updatePublication(id, restDataToUpdate);
    }

    // Retornar la publicación actualizada con sus archivos
    const updated = await this.publicationRepository.findActivePublicationById(
      id,
      userId,
    );

    if (!updated) {
      throw new PublicationNotFoundException(id);
    }

    // Aplicar transformer para evitar duplicación de datos
    return PublicationTransformerHelper.transformPublication(updated);
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
}
