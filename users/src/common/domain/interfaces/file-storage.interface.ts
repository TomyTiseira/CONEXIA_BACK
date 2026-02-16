/**
 * Domain Interface - File Storage
 *
 * This interface defines the contract for file storage operations.
 * It abstracts the storage implementation, allowing for different
 * storage strategies (local filesystem, cloud storage, etc.).
 *
 * Following Clean Architecture principles, this interface belongs
 * to the domain layer and should not depend on any specific implementation.
 */
export interface FileStorage {
  /**
   * Uploads a file to the storage
   *
   * @param file - The file buffer to upload
   * @param path - The destination path/key for the file
   * @param mimetype - The MIME type of the file (optional)
   * @returns Promise with the URL or path where the file was stored
   */
  upload(file: Buffer, path: string, mimetype?: string): Promise<string>;

  /**
   * Deletes a file from the storage
   *
   * @param path - The path/key of the file to delete
   * @returns Promise that resolves when the file is deleted
   */
  delete(path: string): Promise<void>;

  /**
   * Gets the public URL for a file
   *
   * @param path - The path/key of the file
   * @returns The public URL to access the file
   */
  getPublicUrl(path: string): string;

  /**
   * Gets a signed URL for secure, temporary access to a file
   *
   * @param path - The path/key of the file
   * @param expirationMinutes - How long the URL should be valid (default: 60 minutes)
   * @returns Promise with a signed URL that expires after the specified time
   */
  getSignedUrl(path: string, expirationMinutes?: number): Promise<string>;
}
