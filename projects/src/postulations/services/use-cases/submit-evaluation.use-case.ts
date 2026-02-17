import { Injectable, Inject } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  EvaluationDeadlineExpiredException,
  EvaluationSubmissionFailedException,
  InvalidPostulationStateException,
  PostulationNotFoundException,
  UnauthorizedPostulationAccessException,
} from '../../../common/exceptions/postulation.exceptions';
import { MissingEvaluationSubmissionException } from '../../../common/exceptions/postulation.exceptions';
import { SubmitEvaluationDto } from '../../dtos/submit-evaluation.dto';
import { Postulation } from '../../entities/postulation.entity';
import { PostulationStatusCode } from '../../enums/postulation-status.enum';
import { PostulationRepository } from '../../repositories/postulation.repository';
import { PostulationStatusService } from '../postulation-status.service';
import { PostulationValidationService } from '../postulation-validation.service';
import { FileStorage } from '../../../common/domain/interfaces/file-storage.interface';

@Injectable()
export class SubmitEvaluationUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly postulationStatusService: PostulationStatusService,
    private readonly postulationValidationService: PostulationValidationService,
    @Inject('EVALUATION_FILE_STORAGE')
    private readonly evaluationFileStorage: FileStorage,
  ) {}

  async execute(
    submitEvaluationDto: SubmitEvaluationDto,
  ): Promise<Postulation> {
    // 1. Validar que la postulación existe
    const postulation = await this.postulationRepository.findByIdWithState(
      submitEvaluationDto.postulationId,
    );
    if (!postulation) {
      throw new PostulationNotFoundException(submitEvaluationDto.postulationId);
    }

    // 2. Validar que el usuario es el dueño de la postulación
    if (postulation.userId !== submitEvaluationDto.userId) {
      throw new UnauthorizedPostulationAccessException(
        submitEvaluationDto.postulationId,
        submitEvaluationDto.userId,
      );
    }

    // 3. Validar que la postulación está en estado PENDING_EVALUATION
    const pendingEvaluationStatus =
      await this.postulationStatusService.getByCode(
        PostulationStatusCode.PENDING_EVALUATION,
      );
    if (postulation.statusId !== pendingEvaluationStatus.id) {
      throw new InvalidPostulationStateException(
        submitEvaluationDto.postulationId,
        PostulationStatusCode.PENDING_EVALUATION,
        postulation.status?.code || 'unknown',
      );
    }

    // 4. Validar que el deadline no ha expirado
    if (postulation.evaluationDeadline) {
      const now = new Date();
      if (now > postulation.evaluationDeadline) {
        // Actualizar estado a EVALUATION_EXPIRED
        const expiredStatus = await this.postulationStatusService.getByCode(
          PostulationStatusCode.EVALUATION_EXPIRED,
        );
        await this.postulationRepository.updateStatus(
          submitEvaluationDto.postulationId,
          expiredStatus,
        );

        throw new EvaluationDeadlineExpiredException(
          submitEvaluationDto.postulationId,
        );
      }
    }

    // 5. Validar que venga algo para enviar (archivo, link o descripción)
    if (
      !submitEvaluationDto.evaluationData &&
      !submitEvaluationDto.evaluationLink &&
      !submitEvaluationDto.evaluationDescription
    ) {
      throw new MissingEvaluationSubmissionException(
        submitEvaluationDto.postulationId,
      );
    }

    // 6. Procesar y subir archivo de evaluación si viene
    let evaluationUrl: string | undefined;
    let evaluationFilename: string | undefined;
    let evaluationSize: number | undefined;

    console.log('📁 Processing evaluation submission:', {
      postulationId: submitEvaluationDto.postulationId,
      hasEvaluationData: !!submitEvaluationDto.evaluationData,
      hasEvaluationLink: !!submitEvaluationDto.evaluationLink,
      hasEvaluationDescription: !!submitEvaluationDto.evaluationDescription,
      evaluationOriginalName: submitEvaluationDto.evaluationOriginalName,
      evaluationMimetype: submitEvaluationDto.evaluationMimetype,
      evaluationDataLength: submitEvaluationDto.evaluationData?.length,
    });

    try {
      if (submitEvaluationDto.evaluationData) {
        console.log('📤 Uploading evaluation file to GCS...');
        const buffer = Buffer.from(
          submitEvaluationDto.evaluationData,
          'base64',
        );
        const timestamp = Date.now();
        const extension = this.getFileExtension(
          submitEvaluationDto.evaluationOriginalName || 'evaluation.pdf',
        );
        const filename = `evaluation-${submitEvaluationDto.userId}-${submitEvaluationDto.postulationId}-${timestamp}.${extension}`;

        console.log('📤 Uploading file:', {
          filename,
          bufferSize: buffer.length,
          mimetype: submitEvaluationDto.evaluationMimetype,
        });

        evaluationUrl = await this.evaluationFileStorage.upload(
          buffer,
          filename,
          submitEvaluationDto.evaluationMimetype || 'application/pdf',
        );

        evaluationFilename = submitEvaluationDto.evaluationOriginalName;
        evaluationSize = buffer.length;

        console.log('✅ File uploaded successfully:', evaluationUrl);
      } else {
        console.log('⏭️  No evaluation file to upload');
      }
    } catch (error) {
      console.error('❌ Failed to upload evaluation file:', error);
      throw new RpcException('Failed to upload evaluation file');
    }

    // 7. Validar tamaño del archivo de evaluación si viene
    if (evaluationSize) {
      this.postulationValidationService.validateCvFileSize(evaluationSize);
    }

    // 8. Actualizar la postulación con los datos de la evaluación
    try {
      const activeStatus =
        await this.postulationStatusService.getActiveStatus();

      const updateData: Partial<Postulation> = {
        statusId: activeStatus.id,
        evaluationSubmissionUrl: evaluationUrl,
        evaluationSubmissionFilename: evaluationFilename,
        evaluationSubmissionSize: evaluationSize,
        evaluationSubmissionMimetype: submitEvaluationDto.evaluationMimetype,
        evaluationLink: submitEvaluationDto.evaluationLink,
        evaluationDescription: submitEvaluationDto.evaluationDescription,
        evaluationSubmittedAt: new Date(),
      };

      const updatedPostulation = await this.postulationRepository.update(
        submitEvaluationDto.postulationId,
        updateData,
      );

      if (!updatedPostulation) {
        throw new EvaluationSubmissionFailedException();
      }

      return updatedPostulation;
    } catch (error) {
      if (
        error instanceof EvaluationSubmissionFailedException ||
        error instanceof PostulationNotFoundException
      ) {
        throw error;
      }
      throw new EvaluationSubmissionFailedException();
    }
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'pdf';
  }
}
