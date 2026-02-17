import { Module } from '@nestjs/common';
import { GCSFileStorage } from '../common/infrastructure/storage/gcs-file-storage.service';
import { LocalFileStorage } from '../common/infrastructure/storage/local-file-storage.service';
import { FileStorage } from '../common/domain/interfaces/file-storage.interface';
import { envs } from '../config';

/**
 * Module for Technical Evaluation File Storage
 *
 * Environment-aware storage:
 * - Production: Google Cloud Storage (conexia-evaluation-files bucket)
 * - Development: Local filesystem (uploads/evaluations/)
 */
@Module({
  providers: [
    {
      provide: 'EVALUATION_FILE_STORAGE',
      useFactory: (): FileStorage => {
        if (envs.isProd) {
          return new GCSFileStorage(
            envs.gcs.projectId,
            envs.gcs.keyFile,
            envs.gcs.evaluationFilesBucket,
          );
        }
        return new LocalFileStorage('uploads/evaluations');
      },
    },
  ],
  exports: ['EVALUATION_FILE_STORAGE'],
})
export class EvaluationStorageModule {}
