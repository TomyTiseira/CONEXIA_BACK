import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
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
    this.storage = new Storage({
      projectId: this.projectId,
      keyFilename: this.keyFilename,
    });
  }

  /**
   * Uploads a file to Google Cloud Storage
   */
  async upload(file: Buffer, path: string, mimetype: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const blob = bucket.file(path);

    // Create a write stream to upload the file
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: mimetype,
      },
    });

    // Return a promise that resolves when upload is complete
    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        console.error('GCS upload error:', error);
        reject(error);
      });

      blobStream.on('finish', () => {
        // Make the file public (for profile images)
        blob
          .makePublic()
          .then(() => {
            // Return just the filename for backwards compatibility
            // The frontend will use this with GCS public URL
            resolve(path);
          })
          .catch(reject);
      });

      blobStream.end(file);
    });
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
    // Return just the path/filename
    // The actual public URL will be constructed by the frontend
    // using: https://storage.googleapis.com/{bucket}/{path}
    return path;
  }
}
