/**
 * Domain Layer - File Storage Interface
 *
 * This interface defines the contract for file storage operations.
 * Implementations can vary (GCS, S3, local filesystem, etc.)
 * without affecting the domain logic.
 */
export interface FileStorage {
  /**
   * Upload a file buffer to storage
   * @param buffer - The file content as a Buffer
   * @param filename - The name to store the file as
   * @param mimetype - The MIME type of the file
   * @returns Promise<string> - The URL where the file can be accessed
   */
  upload(buffer: Buffer, filename: string, mimetype: string): Promise<string>;

  /**
   * Delete a file from storage
   * @param filename - The name of the file to delete
   * @returns Promise<void>
   */
  delete(filename: string): Promise<void>;

  /**
   * Get the public URL for a file
   * @param filename - The name of the file
   * @returns string - The public URL
   */
  getPublicUrl(filename: string): string;
}
