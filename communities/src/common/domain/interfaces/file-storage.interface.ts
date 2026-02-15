/**
 * Domain Layer - File Storage Interface
 *
 * This interface defines the contract for file storage operations.
 * It abstracts the underlying storage implementation (local filesystem, cloud storage, etc.)
 * following the Dependency Inversion Principle.
 */
export interface FileStorage {
  /**
   * Uploads a file to storage
   * @param file - Buffer containing file data
   * @param path - Destination path/filename in storage
   * @param mimetype - MIME type of the file
   * @returns Promise resolving to the file path or URL
   */
  upload(file: Buffer, path: string, mimetype: string): Promise<string>;

  /**
   * Deletes a file from storage
   * @param path - Path/filename of the file to delete
   * @returns Promise that resolves when file is deleted
   */
  delete(path: string): Promise<void>;

  /**
   * Gets the public URL for a file
   * @param path - Path/filename of the file
   * @returns The public URL to access the file
   */
  getPublicUrl(path: string): string;
}
