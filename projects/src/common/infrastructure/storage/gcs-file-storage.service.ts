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
    const blob = bucket.file(filename);

    // Create a write stream to upload the file
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: mimetype,
        cacheControl: 'public, max-age=31536000',
      },
      // No predefinedAcl when uniform bucket-level access is enabled
      // Public access is managed at bucket level via IAM
    });

    // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        reject(error instanceof Error ? error : new Error(String(error)));
      });

      blobStream.on('finish', () => {
        const publicUrl = this.getPublicUrl(filename);
        resolve(publicUrl);
      });

      blobStream.end(buffer);
    });
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
