/**
 * Domain Layer - File Storage Interface
 *
 * This interface defines the contract for file storage operations.
 * Implementations can use different storage mechanisms (local filesystem, GCS, S3, etc.)
 * while maintaining the same interface.
 *
 * This follows the Dependency Inversion Principle from SOLID,
 * allowing the application to depend on abstractions rather than concrete implementations.
 */
export interface FileStorage {
  /**
   * Uploads a file to storage
   * @param file - File buffer to upload
   * @param path - Storage path/filename  
   * @param mimetype - MIME type of the file (optional)
   * @returns Public URL or path to the uploaded file
   */
  upload(file: Buffer, path: string, mimetype?: string): Promise<string>;

  /**
   * Deletes a file from storage
   * @param path - Storage path/filename of the file to delete
   */
  delete(path: string): Promise<void>;

  /**
   * Gets the public URL for a file
   * @param path - Storage path/filename
   * @returns Public URL to access the file
   */
  getPublicUrl?(path: string): string;
}
