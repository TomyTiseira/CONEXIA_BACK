import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FileStorage } from '../../domain/interfaces/file-storage.interface';

/**
 * Infrastructure Layer - Local File Storage Implementation
 *
 * This service implements the FileStorage interface for local filesystem storage.
 * Used in development environments to maintain current behavior.
 *
 * Files are stored in the local 'uploads/publications' directory.
 */
@Injectable()
export class LocalFileStorage implements FileStorage {
  private readonly uploadDir: string;

  constructor(baseDir: string = 'publications') {
    this.uploadDir = join(process.cwd(), 'uploads', baseDir);
  }

  /**
   * Uploads a file to the local filesystem
   */
  async upload(file: Buffer, path: string): Promise<string> {
    const fullPath = join(this.uploadDir, path);

    // Ensure directory exists
    const dir = join(fullPath, '..');
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, file);

    // Return the relative path (for backwards compatibility)
    return path;
  }

  /**
   * Deletes a file from the local filesystem
   */
  async delete(path: string): Promise<void> {
    try {
      const fullPath = join(this.uploadDir, path);
      await fs.unlink(fullPath);
    } catch (error) {
      // File might not exist, ignore error
      console.warn(`Failed to delete publication file ${path}:`, error.message);
    }
  }

  /**
   * Gets the public URL for a file (returns the filename for local storage)
   */
  getPublicUrl(path: string): string {
    // For local storage, we just return the filename
    // The frontend will prepend IMAGE_URL to construct the full URL
    // e.g., /uploads/publications/{filename}
    return path;
  }
}
