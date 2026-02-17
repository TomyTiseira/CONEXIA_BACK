/**
 * Verification Storage Module
 *
 * Provides file storage for verification documents (ID, passport, selfies).
 * Uses local filesystem in development and GCS bucket in production.
 */
import { Module } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { FileStorage } from '../common/domain/interfaces/file-storage.interface';
import { GCSFileStorage } from '../common/infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from '../common/infrastructure/storage/local-file-storage.service';
import { envs } from '../config';

const verificationStorageProvider = {
  provide: 'VERIFICATION_FILE_STORAGE',
  useFactory: (): FileStorage => {
    const isProduction = envs.nodeEnv === 'production';

    if (isProduction) {
      // Production: Use Google Cloud Storage with verification bucket
      if (!envs.gcs.projectId || !envs.gcs.verificationBucket) {
        throw new RpcException(
          'GCS verification bucket configuration is required in production',
        );
      }

      return new GCSFileStorage(
        envs.gcs.projectId,
        envs.gcs.keyFile || '',
        envs.gcs.verificationBucket,
      );
    } else {
      // Development: Use local filesystem (uploads/verification)
      console.log('Using local file storage for verification document uploads');
      return new LocalFileStorage('uploads/verification');
    }
  },
};

@Module({
  providers: [verificationStorageProvider],
  exports: ['VERIFICATION_FILE_STORAGE'],
})
export class VerificationStorageModule {}
