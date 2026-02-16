import { Module } from '@nestjs/common';
import { envs } from '../config';
import { GCSFileStorage } from '../common/infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from '../common/infrastructure/storage/local-file-storage.service';

/**
 * CV Storage Module - Provides File Storage Implementation for CVs
 *
 * This module uses a factory pattern to provide the appropriate
 * file storage implementation based on the environment:
 * - Production (NODE_ENV=production): Google Cloud Storage (conexia-cv-documents bucket)
 * - Development: Local filesystem (uploads/cv)
 */
@Module({
  providers: [
    {
      provide: 'CV_FILE_STORAGE',
      useFactory: () => {
        if (envs.nodeEnv === 'production') {
          return new GCSFileStorage(
            envs.gcs.projectId,
            envs.gcs.keyFile,
            envs.gcs.cvDocumentsBucket,
          );
        } else {
          return new LocalFileStorage('uploads/cv');
        }
      },
    },
  ],
  exports: ['CV_FILE_STORAGE'],
})
export class CvStorageModule {}
