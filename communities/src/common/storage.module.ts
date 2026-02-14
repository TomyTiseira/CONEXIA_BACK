/**
 * Storage Module
 *
 * This module provides file storage capabilities with automatic
 * selection between local filesystem (development) and Google Cloud Storage (production).
 *
 * Follows Clean Architecture principles by using dependency injection
 * to provide the appropriate storage implementation based on environment.
 */
import { Module } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { envs } from '../config/envs';
import { FileStorage } from './domain/interfaces/file-storage.interface';
import { GCSFileStorage } from './infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from './infrastructure/storage/local-file-storage.service';

const fileStorageProvider = {
  provide: 'FILE_STORAGE',
  useFactory: (): FileStorage => {
    const isProduction = envs.nodeEnv === 'production';

    if (isProduction) {
      // Production: Use Google Cloud Storage
      // Validate required GCS configuration
      if (!envs.gcs.projectId || !envs.gcs.publicationsBucket) {
        throw new RpcException(
          'GCS configuration is required in production for publications',
        );
      }

      return new GCSFileStorage(
        envs.gcs.projectId,
        envs.gcs.keyFile || '',
        envs.gcs.publicationsBucket,
      );
    } else {
      // Development: Use local filesystem
      console.log('Using local file storage for publication uploads');
      return new LocalFileStorage();
    }
  },
};

@Module({
  providers: [fileStorageProvider],
  exports: ['FILE_STORAGE'],
})
export class StorageModule {}
