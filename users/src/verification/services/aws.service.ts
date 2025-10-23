/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  CompareFacesCommand,
  RekognitionClient,
} from '@aws-sdk/client-rekognition';
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import * as fs from 'fs/promises';
import { createWorker } from 'tesseract.js';

@Injectable()
export class AwsService {
  private readonly logger = new Logger(AwsService.name);
  private rekognitionClient: RekognitionClient;

  constructor() {
    // Configurar clientes AWS con credenciales del entorno
    const awsConfig = {
      region: process.env.AWS_REGION || 'us-east-2',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    };

    this.rekognitionClient = new RekognitionClient(awsConfig);
  }

  /**
   * Compara dos rostros usando AWS Rekognition
   * @param sourceImagePath - Ruta a la imagen del documento
   * @param targetImagePath - Ruta a la imagen del rostro del usuario
   * @returns Porcentaje de similitud
   */
  async compareFaces(
    sourceImagePath: string,
    targetImagePath: string,
  ): Promise<number> {
    try {
      this.logger.log(
        `Comparing faces: ${sourceImagePath} vs ${targetImagePath}`,
      );

      // Leer las imágenes como bytes
      const sourceImageBytes = await fs.readFile(sourceImagePath);
      const targetImageBytes = await fs.readFile(targetImagePath);

      const command = new CompareFacesCommand({
        SourceImage: { Bytes: sourceImageBytes },
        TargetImage: { Bytes: targetImageBytes },
        SimilarityThreshold: 90, // Umbral mínimo de similitud
      });

      const response = await this.rekognitionClient.send(command);

      if (!response.FaceMatches || response.FaceMatches.length === 0) {
        this.logger.warn('No face matches found');
        throw new RpcException({
          status: 400,
          message:
            'No se pudo encontrar coincidencia facial. Asegúrese de que ambas imágenes contengan rostros claros y visibles.',
        });
      }

      // Obtener el score de similitud del primer match
      const similarity = response.FaceMatches[0].Similarity || 0;
      this.logger.log(`Face similarity score: ${similarity}%`);

      return similarity;
    } catch (error) {
      this.logger.error(`Error comparing faces: ${error.message}`, error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        status: 500,
        message: `Error al comparar rostros: ${error.message}`,
      });
    }
  }

  /**
   * Extrae texto de un documento usando Tesseract OCR
   * @param imagePath - Ruta a la imagen del documento
   * @returns Texto extraído del documento
   */
  async extractTextFromDocument(imagePath: string): Promise<string> {
    let worker;
    try {
      this.logger.log(
        `Extracting text from document using Tesseract: ${imagePath}`,
      );

      // Crear worker de Tesseract
      worker = await createWorker('spa', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            this.logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Realizar OCR
      const { data } = await worker.recognize(imagePath);
      const extractedText = data.text;

      this.logger.log(`Extracted text length: ${extractedText.length}`);
      this.logger.debug(
        `Extracted text: ${extractedText.substring(0, 200)}...`,
      );

      if (!extractedText || extractedText.trim().length === 0) {
        this.logger.warn('No text found in document');
        throw new RpcException({
          status: 400,
          message:
            'No se pudo extraer texto del documento. Asegúrese de que la imagen sea clara y legible.',
        });
      }

      return extractedText;
    } catch (error) {
      this.logger.error(`Error extracting text: ${error.message}`, error.stack);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        status: 500,
        message: `Error al extraer texto del documento: ${error.message}`,
      });
    } finally {
      // Limpiar worker
      if (worker) {
        await worker.terminate();
      }
    }
  }

  /**
   * Extrae el número de documento del texto usando expresiones regulares
   * @param text - Texto extraído del documento
   * @returns Número de documento encontrado o null
   */
  extractDocumentNumber(text: string): string | null {
    this.logger.log('Extracting document number from text');

    // Patrones comunes para DNI y Pasaportes
    const patterns = [
      // DNI Argentina: 8 dígitos (ej: 12345678)
      /\b\d{8}\b/,
      // DNI con puntos: XX.XXX.XXX
      /\b\d{2}\.\d{3}\.\d{3}\b/,
      // Pasaporte: Letra seguida de números (ej: A12345678)
      /\b[A-Z]\d{7,9}\b/,
      // Pasaporte: Dos letras seguidas de números
      /\b[A-Z]{2}\d{6,9}\b/,
      // Número de documento general: entre 7 y 10 dígitos
      /\b\d{7,10}\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const documentNumber = match[0].replace(/\./g, ''); // Eliminar puntos
        this.logger.log(`Document number found: ${documentNumber}`);
        return documentNumber;
      }
    }

    this.logger.warn('No document number found in text');
    return null;
  }
}
