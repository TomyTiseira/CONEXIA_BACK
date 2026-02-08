/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { FileValidationService } from './file-validation.service';

export interface FileUploadResult {
  filename: string;
  originalName: string;
  size: number;
  path: string;
  url: string;
}

@Injectable()
export class FileHandlerService {
  constructor(private readonly fileValidationService: FileValidationService) {}

  /**
   * Valida y procesa un archivo CV
   * @param file - Archivo CV a procesar
   * @param uploadPath - Ruta donde se subirá el archivo
   * @returns Resultado del procesamiento del archivo
   */
  processCvFile(
    file: Express.Multer.File,
    uploadPath: string,
  ): FileUploadResult {
    // Validar archivo CV
    if (!this.fileValidationService.validateCvFile(file)) {
      throw new Error(
        `CV file validation failed. Only PDF files up to ${this.fileValidationService.getReadableMaxSize(10 * 1024 * 1024)} are allowed.`,
      );
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
      url: `${uploadPath}/${file.filename}`,
    };
  }

  /**
   * Valida y procesa un archivo de imagen
   * @param file - Archivo de imagen a procesar
   * @param uploadPath - Ruta donde se subirá el archivo
   * @returns Resultado del procesamiento del archivo
   */
  processImageFile(
    file: Express.Multer.File,
    uploadPath: string,
  ): FileUploadResult {
    // Validar archivo de imagen
    if (!this.fileValidationService.validateImageFile(file)) {
      throw new Error(
        `Image file validation failed. Only JPEG/PNG files up to ${this.fileValidationService.getReadableMaxSize(5 * 1024 * 1024)} are allowed.`,
      );
    }

    return {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
      url: `${uploadPath}/${file.filename}`,
    };
  }

  /**
   * Elimina un archivo del sistema
   * @param filePath - Ruta del archivo a eliminar
   * @returns true si se eliminó correctamente
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Elimina múltiples archivos del sistema
   * @param filePaths - Rutas de los archivos a eliminar
   * @returns Número de archivos eliminados correctamente
   */
  async deleteFiles(filePaths: string[]): Promise<number> {
    const deletePromises = filePaths.map((path) => this.deleteFile(path));
    const results = await Promise.allSettled(deletePromises);

    return results.filter(
      (result) => result.status === 'fulfilled' && result.value,
    ).length;
  }

  /**
   * Limpia archivos temporales en caso de error
   * @param files - Archivos a limpiar
   */
  async cleanupFilesOnError(files: Express.Multer.File[]): Promise<void> {
    const filePaths = files.map((file) => file.path).filter(Boolean);
    if (filePaths.length > 0) {
      await this.deleteFiles(filePaths);
    }
  }

  /**
   * Genera un nombre único para un archivo
   * @param originalName - Nombre original del archivo
   * @returns Nombre único generado
   */
  generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Obtiene la extensión de un archivo
   * @param filename - Nombre del archivo
   * @returns Extensión del archivo
   */
  getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Obtiene el tamaño de un archivo en formato legible
   * @param sizeInBytes - Tamaño en bytes
   * @returns Tamaño en formato legible
   */
  getReadableFileSize(sizeInBytes: number): string {
    return this.fileValidationService.getReadableMaxSize(sizeInBytes);
  }
}
