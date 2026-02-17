/* eslint-disable @typescript-eslint/no-unused-vars */
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
 * Files are stored in the local 'uploads/projects' directory.
 */
@Injectable()
export class LocalFileStorage implements FileStorage {
  private readonly uploadDir: string;

  constructor(baseDir: string = 'uploads/projects') {
    this.uploadDir = join(process.cwd(), baseDir);
  }

  async upload(
    buffer: Buffer,
    filename: string,
    _mimetype: string,
  ): Promise<string> {
    // Ensure directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    const filePath = join(this.uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    return this.getPublicUrl(filename);
  }

  async delete(filename: string): Promise<void> {
    const filePath = join(this.uploadDir, filename);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Ignore error if file doesn't exist
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getPublicUrl(filename: string): string {
    // In local development, return a relative path
    return `/uploads/projects/${filename}`;
  }
}
