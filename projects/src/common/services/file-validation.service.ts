import { Injectable } from '@nestjs/common';

export interface FileValidationOptions {
  maxSize: number; // en bytes
  allowedTypes: string[];
  allowedExtensions?: string[];
}

@Injectable()
export class FileValidationService {
  /**
   * Valida el tamaño de un archivo
   * @param fileSize - Tamaño del archivo en bytes
   * @param maxSize - Tamaño máximo permitido en bytes
   * @returns true si el archivo es válido
   */
  validateFileSize(fileSize: number, maxSize: number): boolean {
    return fileSize <= maxSize;
  }

  /**
   * Valida el tipo MIME de un archivo
   * @param mimeType - Tipo MIME del archivo
   * @param allowedTypes - Lista de tipos MIME permitidos
   * @returns true si el tipo es válido
   */
  validateMimeType(mimeType: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimeType);
  }

  /**
   * Valida la extensión de un archivo
   * @param filename - Nombre del archivo
   * @param allowedExtensions - Lista de extensiones permitidas
   * @returns true si la extensión es válida
   */
  validateFileExtension(
    filename: string,
    allowedExtensions: string[],
  ): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedExtensions.includes(extension) : false;
  }

  /**
   * Valida un archivo completo (tamaño, tipo MIME y extensión)
   * @param file - Archivo a validar
   * @param options - Opciones de validación
   * @returns true si el archivo es válido
   */
  validateFile(
    file: Express.Multer.File,
    options: FileValidationOptions,
  ): boolean {
    // Validar tamaño
    if (!this.validateFileSize(file.size, options.maxSize)) {
      return false;
    }

    // Validar tipo MIME
    if (!this.validateMimeType(file.mimetype, options.allowedTypes)) {
      return false;
    }

    // Validar extensión si se especifica
    if (
      options.allowedExtensions &&
      !this.validateFileExtension(file.originalname, options.allowedExtensions)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Obtiene el tamaño máximo en formato legible
   * @param maxSize - Tamaño máximo en bytes
   * @returns Tamaño máximo en formato legible (KB, MB, GB)
   */
  getReadableMaxSize(maxSize: number): string {
    if (maxSize < 1024) {
      return `${maxSize} bytes`;
    } else if (maxSize < 1024 * 1024) {
      return `${(maxSize / 1024).toFixed(1)} KB`;
    } else if (maxSize < 1024 * 1024 * 1024) {
      return `${(maxSize / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(maxSize / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  }

  /**
   * Valida un archivo CV (PDF, máximo 10MB)
   * @param file - Archivo CV a validar
   * @returns true si el archivo CV es válido
   */
  validateCvFile(file: Express.Multer.File): boolean {
    const cvOptions: FileValidationOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf'],
      allowedExtensions: ['pdf'],
    };

    return this.validateFile(file, cvOptions);
  }

  /**
   * Valida un archivo de imagen (JPEG, PNG, máximo 5MB)
   * @param file - Archivo de imagen a validar
   * @returns true si el archivo de imagen es válido
   */
  validateImageFile(file: Express.Multer.File): boolean {
    const imageOptions: FileValidationOptions = {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png'],
      allowedExtensions: ['jpg', 'jpeg', 'png'],
    };

    return this.validateFile(file, imageOptions);
  }
}
