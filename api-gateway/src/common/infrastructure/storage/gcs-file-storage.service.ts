import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { RpcException } from '@nestjs/microservices';
import { FileStorage } from '../../domain/interfaces/file-storage.interface';

/**
 * Infrastructure Layer - Google Cloud Storage Implementation
 *
 * This service implements the FileStorage interface for Google Cloud Storage.
 * Used in production environments to store files in GCS.
 *
 * Files are stored in the configured GCS bucket.
 */
@Injectable()
export class GCSFileStorage implements FileStorage {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(
    private readonly projectId: string,
    private readonly keyFilename: string,
    bucketName: string,
  ) {
    this.bucketName = bucketName;

    // Initialize Google Cloud Storage client
    // If keyFilename is empty or doesn't exist, use Application Default Credentials (for Cloud Run/GKE)
    const storageConfig: any = {
      projectId: this.projectId,
    };

    // Only add keyFilename if it's provided and not empty
    if (keyFilename && keyFilename.trim() !== '') {
      storageConfig.keyFilename = keyFilename;
    }

    this.storage = new Storage(storageConfig);
  }

  /**
   * Uploads a file to Google Cloud Storage
   */
  async upload(file: Buffer, path: string, mimetype: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const blob = bucket.file(path);

      console.log(
        `[GCS] Uploading file to bucket: ${this.bucketName}, path: ${path}`,
      );

      // Upload file
      await blob.save(file, {
        metadata: {
          contentType: mimetype,
          cacheControl: 'public, max-age=31536000',
        },
      });

      console.log(
        '[GCS] File uploaded successfully, attempting to make public...',
      );

      // Make file publicly readable
      try {
        await blob.makePublic();
        console.log('[GCS] File made public successfully');
      } catch (publicError) {
        console.warn(
          '[GCS] Could not make file public (file will still be accessible if bucket is public):',
          publicError.message,
        );
      }

      // Return public URL
      const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${path}`;
      console.log('[GCS] Returning public URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('[GCS] Upload error:', error);
      console.error('[GCS] Error details:', {
        message: error.message,
        code: error.code,
        errors: error.errors,
      });
      throw new RpcException(
        `Failed to upload file to Google Cloud Storage: ${error.message}`,
      );
    }
  }

  /**
   * Deletes a file from Google Cloud Storage
   */
  async delete(path: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(path).delete();
    } catch (error) {
      // File might not exist, log but don't throw
      console.warn(`Failed to delete file ${path} from GCS:`, error.message);
    }
  }

  /**
   * Gets the public URL for a file in GCS
   */
  getPublicUrl(path: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${path}`;
  }
}
