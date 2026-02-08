/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
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

@Injectable()
export class SubmitEvaluationUseCase {
  constructor(
    private readonly postulationRepository: PostulationRepository,
    private readonly postulationStatusService: PostulationStatusService,
    private readonly postulationValidationService: PostulationValidationService,
  ) {}

  async execute(submitEvaluationDto: SubmitEvaluationDto): Promise<Postulation> {
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
    const pendingEvaluationStatus = await this.postulationStatusService.getByCode(
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
      !submitEvaluationDto.evaluationFileUrl &&
      !submitEvaluationDto.evaluationLink &&
      !submitEvaluationDto.evaluationDescription
    ) {
      throw new MissingEvaluationSubmissionException(submitEvaluationDto.postulationId);
    }

    // 6. Validar tamaño del archivo de evaluación si viene

    if (submitEvaluationDto.evaluationFileSize) {
      this.postulationValidationService.validateCvFileSize(
        submitEvaluationDto.evaluationFileSize,
      );
    }

    // 7. Actualizar la postulación con los datos de la evaluación
    try {
      const activeStatus = await this.postulationStatusService.getActiveStatus();

      const updateData: Partial<Postulation> = {
        statusId: activeStatus.id,
        evaluationSubmissionUrl: submitEvaluationDto.evaluationFileUrl,
        evaluationSubmissionFilename: submitEvaluationDto.evaluationFilename,
        evaluationSubmissionSize: submitEvaluationDto.evaluationFileSize,
        evaluationSubmissionMimetype: submitEvaluationDto.evaluationFileMimetype,
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
}
