import { Injectable, Logger } from '@nestjs/common';
import { PublicationMediaRepository } from '../repositories/publication-media.repository';
import { PublicationRepository } from '../repositories/publication.repository';

@Injectable()
export class MigrateLegacyMediaService {
  private readonly logger = new Logger(MigrateLegacyMediaService.name);

  constructor(
    private readonly publicationRepository: PublicationRepository,
    private readonly publicationMediaRepository: PublicationMediaRepository,
  ) {}

  async migrateLegacyMedia(): Promise<void> {
    this.logger.log('Starting migration of legacy media files...');

    // Buscar publicaciones que tienen mediaUrl pero no tienen registros en publication_media
    const publicationsWithLegacyMedia = await this.publicationRepository
      .createQueryBuilder('publication')
      .leftJoin('publication.media', 'media')
      .where('publication.mediaUrl IS NOT NULL')
      .andWhere('publication.mediaUrl != ""')
      .andWhere('media.id IS NULL') // No tiene registros en publication_media
      .getMany();

    this.logger.log(
      `Found ${publicationsWithLegacyMedia.length} publications with legacy media to migrate`,
    );

    let migratedCount = 0;
    let errorCount = 0;

    for (const publication of publicationsWithLegacyMedia) {
      try {
        // Crear nuevo registro en publication_media
        const mediaRecord = this.publicationMediaRepository.create({
          publicationId: publication.id,
          filename: publication.mediaFilename || 'unknown',
          fileUrl: publication.mediaUrl,
          fileType: this.getLegacyMimeType(publication.mediaType),
          fileSize: publication.mediaSize || 0,
          displayOrder: 1,
        });

        await this.publicationMediaRepository.save(mediaRecord);
        migratedCount++;

        this.logger.debug(`Migrated media for publication ${publication.id}`);
      } catch (error) {
        errorCount++;
        this.logger.error(
          `Error migrating media for publication ${publication.id}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Migration completed: ${migratedCount} migrated, ${errorCount} errors`,
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

  async cleanupLegacyFields(): Promise<void> {
    this.logger.log('Starting cleanup of legacy media fields...');

    // Solo limpiar campos legacy de publicaciones que ya tienen datos migrados
    const result = await this.publicationRepository
      .createQueryBuilder()
      .update()
      .set({
        mediaUrl: undefined,
        mediaFilename: undefined,
        mediaSize: undefined,
        mediaType: undefined,
      })
      .where('id IN (SELECT DISTINCT publication_id FROM publication_media)')
      .execute();

    this.logger.log(
      `Cleaned up legacy fields for ${result.affected} publications`,
    );
  }
}
