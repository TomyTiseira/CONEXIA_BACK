/**
 * Message Storage Module
 *
 * This module provides file storage capabilities for messaging attachments
 * with automatic selection between local filesystem (development) and
 * Google Cloud Storage (production).
 *
 * Follows Clean Architecture principles by using dependency injection
 * to provide the appropriate storage implementation based on environment.
 */
import { Module } from '@nestjs/common';
import { envs } from '../config/envs';
import { FileStorage } from './domain/interfaces/file-storage.interface';
import { GCSFileStorage } from './infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from './infrastructure/storage/local-file-storage.service';

const messageStorageProvider = {
  provide: 'MESSAGE_FILE_STORAGE',
  useFactory: (): FileStorage => {
    const isProduction = envs.nodeEnv === 'production';

    if (isProduction) {
      // Production: Use Google Cloud Storage
      // Validate required GCS configuration
      if (!envs.gcs.projectId || !envs.gcs.messagesBucket) {
        throw new Error(
          'GCS configuration is required in production for messages',
        );
      }

      console.log(
        `[MessageStorage] Using GCS bucket: ${envs.gcs.messagesBucket}`,
      );
      return new GCSFileStorage(
        envs.gcs.projectId,
        envs.gcs.keyFile || '',
        envs.gcs.messagesBucket,
      );
    } else {
      // Development: Use local filesystem
      console.log('[MessageStorage] Using local file storage for messages');
      return new LocalFileStorage('messages');
    }
  },
};

@Module({
  providers: [messageStorageProvider],
  exports: ['MESSAGE_FILE_STORAGE'],
})
export class MessageStorageModule {}
