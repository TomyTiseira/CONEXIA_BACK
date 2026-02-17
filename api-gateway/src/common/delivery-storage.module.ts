/**
 * Delivery Storage Module
 *
 * This module provides file storage capabilities for service delivery attachments
 * and compliance evidence files with automatic selection between local filesystem
 * (development) and Google Cloud Storage (production).
 *
 * Follows Clean Architecture principles by using dependency injection
 * to provide the appropriate storage implementation based on environment.
 */
import { Module } from '@nestjs/common';
import { envs } from '../config/envs';
import { FileStorage } from './domain/interfaces/file-storage.interface';
import { GCSFileStorage } from './infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from './infrastructure/storage/local-file-storage.service';

const deliveryStorageProvider = {
  provide: 'DELIVERY_FILE_STORAGE',
  useFactory: (): FileStorage => {
    const isProduction = envs.nodeEnv === 'production';

    if (isProduction) {
      // Production: Use Google Cloud Storage
      // Validate required GCS configuration
      if (!envs.gcs.projectId || !envs.gcs.deliveryAttachmentsBucket) {
        throw new Error(
          'GCS configuration is required in production for delivery attachments',
        );
      }

      console.log(
        `[DeliveryStorage] Using GCS bucket: ${envs.gcs.deliveryAttachmentsBucket}`,
      );
      return new GCSFileStorage(
        envs.gcs.projectId,
        envs.gcs.keyFile || '',
        envs.gcs.deliveryAttachmentsBucket,
      );
    } else {
      // Development: Use local filesystem
      // Store in uploads/deliveries to match static file serving
      console.log(
        '[DeliveryStorage] Using local file storage for deliveries and compliances',
      );
      return new LocalFileStorage('uploads/deliveries');
    }
  },
};

@Module({
  providers: [deliveryStorageProvider],
  exports: ['DELIVERY_FILE_STORAGE'],
})
export class DeliveryStorageModule {}
