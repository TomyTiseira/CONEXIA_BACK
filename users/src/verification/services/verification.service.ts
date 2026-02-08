import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    try {
      // Paso 1: Extraer texto del documento usando Textract
      this.logger.log('Step 1: Extracting text from document');
      const extractedText = await this.awsService.extractTextFromDocument(
        documentImage.path,
      );

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
        documentImage.path,
        faceImage.path,
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
}
