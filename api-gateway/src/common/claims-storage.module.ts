import { Module } from '@nestjs/common';
import { envs } from '../config/envs';
import { FileStorage } from './domain/interfaces/file-storage.interface';
import { GCSFileStorage } from './infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from './infrastructure/storage/local-file-storage.service';

/**
 * Claims Storage Module
 * Provides file storage for claim evidence files
 * - Production: Google Cloud Storage (conexia-claims-evidence bucket)
 * - Development: Local file system
 */
const claimsStorageProvider = {
  provide: 'CLAIMS_FILE_STORAGE',
  useFactory: (): FileStorage => {
    const isProduction = envs.nodeEnv === 'production';

    if (isProduction) {
      // Production: Use Google Cloud Storage
      if (!envs.gcs.projectId || !envs.gcs.claimsEvidenceBucket) {
        throw new Error(
          'GCS configuration is required in production for claims evidence',
        );
      }

      console.log(
        `[ClaimsStorage] Using GCS bucket: ${envs.gcs.claimsEvidenceBucket}`,
      );
      return new GCSFileStorage(
        envs.gcs.projectId,
        envs.gcs.keyFile || '',
        envs.gcs.claimsEvidenceBucket,
      );
    } else {
      // Development: Use local filesystem
      console.log('[ClaimsStorage] Using local file storage for claims');
      return new LocalFileStorage('uploads/claims');
    }
  },
};

@Module({
  providers: [claimsStorageProvider],
  exports: ['CLAIMS_FILE_STORAGE'],
})
export class ClaimsStorageModule {}
