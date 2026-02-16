import { Module } from '@nestjs/common';
import { envs } from '../config';
import { GCSFileStorage } from './infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from './infrastructure/storage/local-file-storage.service';

/**
 * Storage Module - Provides File Storage Implementation
 *
 * This module uses a factory pattern to provide the appropriate
 * file storage implementation based on the environment:
 * - Production (NODE_ENV=production): Google Cloud Storage
 * - Development: Local filesystem
 */
@Module({
  providers: [
    {
      provide: 'FILE_STORAGE',
      useFactory: () => {
        if (envs.nodeEnv === 'production') {
          return new GCSFileStorage(
            envs.gcs.projectId,
            envs.gcs.keyFile,
            envs.gcs.projectFilesBucket,
          );
        } else {
          return new LocalFileStorage('uploads/projects');
        }
      },
    },
  ],
  exports: ['FILE_STORAGE'],
})
export class StorageModule {}
