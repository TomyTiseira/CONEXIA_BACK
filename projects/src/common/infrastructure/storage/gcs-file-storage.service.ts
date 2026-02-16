import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { FileStorage } from '../../domain/interfaces/file-storage.interface';

/**
 * Infrastructure Layer - Google Cloud Storage Implementation
 *
 * This service implements the FileStorage interface using Google Cloud Storage.
 * Used in production environments.
 *
 * Files are stored in the conexia-project-files bucket.
 */
@Injectable()
export class GCSFileStorage implements FileStorage {
  private storage: Storage;
  private bucketName: string;

  constructor(projectId: string, keyFilename: string, bucketName: string) {
    this.storage = new Storage({
      projectId,
      keyFilename,
    });
    this.bucketName = bucketName;
  }

  async upload(
    buffer: Buffer,
    filename: string,
    mimetype: string,
  ): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    await file.save(buffer, {
      metadata: {
        contentType: mimetype,
      },
      public: true,
    });

    return this.getPublicUrl(filename);
  }

  async delete(filename: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);
    await file.delete();
  }

  getPublicUrl(filename: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
  }
}
