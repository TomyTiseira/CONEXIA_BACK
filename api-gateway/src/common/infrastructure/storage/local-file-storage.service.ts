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
 * Files are stored in the local 'uploads' directory.
 */
@Injectable()
export class LocalFileStorage implements FileStorage {
  private readonly uploadDir: string;

  constructor(baseDir: string = 'uploads') {
    this.uploadDir = join(process.cwd(), baseDir);
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

    // Return the relative path - if uploadDir is already 'uploads/something',
    // extract the part after 'uploads' to build correct URL
    const uploadsDirIndex = this.uploadDir.indexOf('uploads');
    if (uploadsDirIndex !== -1) {
      // Extract relative path from 'uploads' onwards
      const relativePath = this.uploadDir.substring(uploadsDirIndex + 'uploads'.length);
      // Combine with the file path
      const finalPath = relativePath ? `${relativePath}/${path}` : path;
      return `/uploads${finalPath}`;
    }
    
    // Fallback for backwards compatibility
    return `/uploads/${path}`;
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
      console.warn(`Failed to delete file ${path}:`, error.message);
    }
  }

  /**
   * Gets the public URL for a file (local path)
   */
  getPublicUrl(path: string): string {
    return `/uploads/${path}`;
  }
}
