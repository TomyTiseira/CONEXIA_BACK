import { Inject, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileStorage } from '../../common/domain/interfaces/file-storage.interface';
import { Profile } from '../../profile/entities/profile.entity';
import { User } from '../../shared/entities/user.entity';
import {
  VerifyIdentityDto,
  VerifyIdentityResponseDto,
} from '../dto/verify-identity.dto';
import { UserVerification } from '../entities/user-verification.entity';
import { VerificationRepository } from '../repository/verification.repository';
import { AwsService } from './aws.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);
  private readonly SIMILARITY_THRESHOLD = 90; // Umbral de similitud mínimo

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly verificationRepository: VerificationRepository,
    private readonly awsService: AwsService,
    @Inject('VERIFICATION_FILE_STORAGE')
    private readonly fileStorage: FileStorage,
  ) {}

  /**
   * Verifica la identidad de un usuario comparando su DNI/pasaporte con su rostro
   */
  async verifyIdentity(
    verifyIdentityDto: VerifyIdentityDto,
  ): Promise<VerifyIdentityResponseDto> {
    const { userId, documentImage, faceImage, documentType } =
      verifyIdentityDto;

    this.logger.log(`Starting identity verification for user ${userId}`);

    // Validar que el usuario existe
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new RpcException({
        status: 404,
        message: 'Usuario no encontrado',
      });
    }

    // Validar que el usuario tiene perfil con número de documento
    if (!user.profile) {
      throw new RpcException({
        status: 400,
        message:
          'El usuario debe completar su perfil antes de verificar su identidad',
      });
    }

    const profile = await this.profileRepository.findOne({
      where: { id: user.profileId },
    });

    if (!profile || !profile.documentNumber) {
      throw new RpcException({
        status: 400,
        message:
          'El perfil del usuario debe tener un número de documento registrado',
      });
    }

    let verificationRecord: UserVerification;
    let extractedDocumentNumber: string | null = null;
    let documentNumberMatch = false;
    let similarityScore = 0;
    let errorMessage: string | null = null;

    // Process and upload files - keep buffers for AWS processing
    let documentImagePath: string;
    let faceImagePath: string;
    let documentImageBuffer: Buffer;
    let faceImageBuffer: Buffer;

    try {
      // Process document image
      if (documentImage.fileData) {
        // New base64 approach - upload to storage
        this.logger.log('Processing document image from base64');
        documentImageBuffer = Buffer.from(documentImage.fileData, 'base64');
        const timestamp = Date.now();
        const extension = this.getExtensionFromMimeType(
          documentImage.mimeType || 'image/jpeg',
        );
        const filename = `document-${userId}-${timestamp}.${extension}`;

        documentImagePath = await this.fileStorage.upload(
          documentImageBuffer,
          filename,
          documentImage.mimeType || 'image/jpeg',
        );
        this.logger.log(`Document image uploaded: ${documentImagePath}`);
      } else if (documentImage.path) {
        // Legacy path approach - read from filesystem
        const fs = await import('fs/promises');
        documentImageBuffer = await fs.readFile(documentImage.path);
        documentImagePath = documentImage.path;
      } else {
        throw new RpcException({
          status: 400,
          message: 'Document image must have either fileData (base64) or path',
        });
      }

      // Process face image
      if (faceImage.fileData) {
        // New base64 approach - upload to storage
        this.logger.log('Processing face image from base64');
        faceImageBuffer = Buffer.from(faceImage.fileData, 'base64');
        const timestamp = Date.now();
        const extension = this.getExtensionFromMimeType(
          faceImage.mimeType || 'image/jpeg',
        );
        const filename = `face-${userId}-${timestamp}.${extension}`;

        faceImagePath = await this.fileStorage.upload(
          faceImageBuffer,
          filename,
          faceImage.mimeType || 'image/jpeg',
        );
        this.logger.log(`Face image uploaded: ${faceImagePath}`);
      } else if (faceImage.path) {
        // Legacy path approach - read from filesystem
        const fs = await import('fs/promises');
        faceImageBuffer = await fs.readFile(faceImage.path);
        faceImagePath = faceImage.path;
      } else {
        throw new RpcException({
          status: 400,
          message: 'Face image must have either fileData (base64) or path',
        });
      }
    } catch (error) {
      this.logger.error('Error processing images:', error);
      throw new RpcException({
        status: 500,
        message: `Failed to process images: ${error.message}`,
      });
    }

    try {
      // Paso 1: Extraer texto del documento usando Textract
      this.logger.log('Step 1: Extracting text from document');
      const extractedText =
        await this.awsService.extractTextFromDocument(documentImageBuffer);

      // Paso 2: Buscar el número de documento en el texto extraído
      this.logger.log('Step 2: Searching for document number');
      extractedDocumentNumber =
        this.awsService.extractDocumentNumber(extractedText);

      if (!extractedDocumentNumber) {
        errorMessage =
          'No se pudo extraer el número de documento de la imagen. Asegúrese de que la imagen sea clara y legible.';
        throw new RpcException({
          status: 400,
          message: errorMessage,
        });
      }

      // Paso 3: Validar que el número extraído coincida con el del perfil
      this.logger.log('Step 3: Validating document number match');
      const profileDocumentNumber = profile.documentNumber.replace(/\D/g, ''); // Eliminar no-dígitos
      const extractedNumberClean = extractedDocumentNumber.replace(/\D/g, '');

      documentNumberMatch =
        profileDocumentNumber === extractedNumberClean ||
        profileDocumentNumber.includes(extractedNumberClean) ||
        extractedNumberClean.includes(profileDocumentNumber);

      if (!documentNumberMatch) {
        errorMessage = `El número de documento extraído (${extractedDocumentNumber}) no coincide con el registrado en el perfil (${profile.documentNumber}).`;
        throw new RpcException({
          status: 400,
          message: errorMessage,
        });
      }

      // Paso 4: Comparar rostros usando Rekognition
      this.logger.log('Step 4: Comparing faces');
      similarityScore = await this.awsService.compareFaces(
        documentImageBuffer,
        faceImageBuffer,
      );

      // Paso 5: Validar el umbral de similitud
      this.logger.log('Step 5: Validating similarity threshold');
      if (similarityScore < this.SIMILARITY_THRESHOLD) {
        errorMessage = `La similitud facial (${similarityScore.toFixed(2)}%) es menor al umbral requerido (${this.SIMILARITY_THRESHOLD}%).`;
        throw new RpcException({
          status: 400,
          message: errorMessage,
        });
      }

      // Si llegamos aquí, la verificación fue exitosa
      this.logger.log(`Verification successful with score: ${similarityScore}`);

      // Paso 6: Actualizar el campo verified del usuario
      this.logger.log('Step 6: Updating user verified status');
      await this.userRepository.update(userId, { verified: true });

      // Paso 7: Guardar el registro de verificación
      verificationRecord = await this.verificationRepository.createVerification(
        {
          userId,
          documentNumberExtracted: extractedDocumentNumber,
          documentNumberMatch: true,
          similarityScore,
          matchResult: true,
          documentType: documentType || 'DNI',
        },
      );

      this.logger.log(
        `Identity verification successful for user ${userId} (Verification ID: ${verificationRecord.verificationId})`,
      );

      return {
        verified: true,
        similarity_score: similarityScore,
        document_number_extracted: extractedDocumentNumber,
        document_number_match: true,
        message: 'Identidad verificada exitosamente',
        verification_id: verificationRecord.verificationId,
      };
    } catch (error) {
      this.logger.error(
        `Identity verification failed for user ${userId}: ${error.message}`,
        error.stack,
      );

      // Guardar el registro de verificación fallida
      verificationRecord = await this.verificationRepository.createVerification(
        {
          userId,
          documentNumberExtracted: extractedDocumentNumber || undefined,
          documentNumberMatch,
          similarityScore,
          matchResult: false,
          documentType: documentType || 'DNI',
          errorMessage:
            errorMessage || (error as Error)?.message || 'Error desconocido',
        },
      );

      // Re-lanzar la excepción
      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        status: 500,
        message: `Error durante la verificación: ${error.message}`,
      });
    }
  }

  /**
   * Obtiene el historial de verificaciones de un usuario
   */
  async getVerificationHistory(userId: number): Promise<UserVerification[]> {
    return await this.verificationRepository.findByUserId(userId);
  }

  /**
   * Obtiene el estado de verificación actual de un usuario
   */
  async getVerificationStatus(userId: number): Promise<{
    isVerified: boolean;
    latestVerification: UserVerification | null;
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new RpcException({
        status: 404,
        message: 'Usuario no encontrado',
      });
    }

    const latestVerification =
      await this.verificationRepository.findLatestByUserId(userId);

    return {
      isVerified: user.verified || false,
      latestVerification,
    };
  }

  /**
   * Helper para obtener extensión de archivo desde MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    return mimeMap[mimeType] || 'jpg';
  }
}
