/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  AlreadyAppliedToRoleException,
  InvalidApplicationTypesException,
  InvalidUserRoleException,
  MissingRequiredAnswersException,
  RoleMaxCollaboratorsReachedException,
  RoleNotAcceptingApplicationsException,
  RoleNotBelongToProjectException,
  RoleNotFoundException,
} from '../../../common/exceptions/postulation.exceptions';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ApplicationType } from '../../../projects/dtos/publish-project.dto';
import { ProjectRepository } from '../../../projects/repositories/project.repository';
import { CreatePostulationDto } from '../../dtos/create-postulation.dto';
import { Postulation } from '../../entities/postulation.entity';
import { PostulationStatusCode } from '../../enums/postulation-status.enum';
import { PostulationRepository } from '../../repositories/postulation.repository';
import { PostulationStatusService } from '../postulation-status.service';
import { PostulationValidationService } from '../postulation-validation.service';

@Injectable()
export class CreatePostulationUseCase {
  constructor(
    private readonly postulationValidationService: PostulationValidationService,
    private readonly postulationRepository: PostulationRepository,
    private readonly postulationStatusService: PostulationStatusService,
    private readonly projectRepository: ProjectRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    createPostulationDto: CreatePostulationDto,
    currentUserId: number,
  ): Promise<Postulation> {
    // 1. Validar que el role existe y obtener sus datos
    const role = await this.projectRepository.findRoleByIdWithRelations(
      createPostulationDto.roleId,
    );
    if (!role) {
      throw new RoleNotFoundException(createPostulationDto.roleId);
    }

    // 2. Validar que el role pertenece al proyecto especificado
    if (role.projectId !== createPostulationDto.projectId) {
      throw new RoleNotBelongToProjectException(
        createPostulationDto.roleId,
        createPostulationDto.projectId,
      );
    }

    // 3. Validar que el proyecto existe y está activo
    const project =
      await this.postulationValidationService.validateProjectExistsAndActive(
        role.projectId,
      );

    // 3. Validar que el usuario no es el dueño del proyecto
    this.postulationValidationService.validateUserNotProjectOwner(
      project,
      currentUserId,
    );

    // 4. Validar que el proyecto no ha terminado
    this.postulationValidationService.validateProjectNotEnded(project);

    // 5. Validar que el usuario no esté ya postulado a este rol
    const existingPostulation =
      await this.postulationRepository.findByRoleAndUser(
        createPostulationDto.roleId,
        currentUserId,
      );
    if (existingPostulation) {
      // Permitir solo si la postulación anterior fue cancelada
      const cancelledStatus =
        await this.postulationStatusService.getCancelledStatus();
      if (existingPostulation.statusId !== cancelledStatus.id) {
        throw new AlreadyAppliedToRoleException(
          currentUserId,
          createPostulationDto.roleId,
        );
      }
    }

    // 6. Validar que el rol tiene vacantes disponibles
    if (role.maxCollaborators && role.maxCollaborators > 0) {
      const acceptedCount =
        await this.postulationRepository.countAcceptedByRole(
          createPostulationDto.roleId,
        );
      if (acceptedCount >= role.maxCollaborators) {
        throw new RoleMaxCollaboratorsReachedException(
          createPostulationDto.roleId,
        );
      }
    }

    // 7. Validar que el usuario tiene rol de user y está verificado
    await this.validateUserRole(currentUserId);
    await this.usersClientService.validateUserIsVerified(currentUserId);

    // 8. Validar campos específicos según el tipo de rol
    const isInvestorRole = role.title.toLowerCase() === 'inversor';
    const isPartnerRole = role.title.toLowerCase() === 'socio';

    // Validar que los campos de inversor solo se envíen para roles de inversor
    if (!isInvestorRole && (createPostulationDto.investorAmount || createPostulationDto.investorMessage)) {
      throw new InvalidApplicationTypesException(
        createPostulationDto.roleId,
        'Investor fields can only be provided when applying to an Investor role',
      );
    }

    // Validar que los campos de socio solo se envíen para roles de socio
    if (!isPartnerRole && createPostulationDto.partnerDescription) {
      throw new InvalidApplicationTypesException(
        createPostulationDto.roleId,
        'Partner fields can only be provided when applying to a Partner role',
      );
    }

    // Si es rol de inversor, validar que los campos requeridos estén presentes
    if (isInvestorRole) {
      if (!createPostulationDto.investorMessage) {
        throw new InvalidApplicationTypesException(
          createPostulationDto.roleId,
          'Investor message is required for Investor role',
        );
      }
      if (!createPostulationDto.investorAmount || createPostulationDto.investorAmount <= 0) {
        throw new InvalidApplicationTypesException(
          createPostulationDto.roleId,
          'Valid investment amount is required for Investor role',
        );
      }
    }

    // Si es rol de socio, validar que los campos requeridos estén presentes
    if (isPartnerRole) {
      if (!createPostulationDto.partnerDescription) {
        throw new InvalidApplicationTypesException(
          createPostulationDto.roleId,
          'Partner description is required for Partner role',
        );
      }
    }

    // 9. Validar y procesar según applicationTypes del rol
    const hasCV = role.applicationTypes?.includes(ApplicationType.CV);
    const hasQuestions = role.applicationTypes?.includes(
      ApplicationType.QUESTIONS,
    );
    const hasEvaluation = role.applicationTypes?.includes(
      ApplicationType.EVALUATION,
    );

    // Validar que el rol tiene al menos un application type
    if (!hasCV && !hasQuestions && !hasEvaluation) {
      throw new RoleNotAcceptingApplicationsException(
        createPostulationDto.roleId,
        'Role has no application types configured',
      );
    }

    // Validar CV si es requerido
    if (hasCV && !createPostulationDto.cvUrl) {
      throw new InvalidApplicationTypesException(
        createPostulationDto.roleId,
        'CV is required for this role',
      );
    }

    // Validar tamaño del CV si viene
    if (createPostulationDto.cvSize) {
      this.postulationValidationService.validateCvFileSize(
        createPostulationDto.cvSize,
      );
    }

    // Validar respuestas si se requieren preguntas
    if (hasQuestions) {
      const roleQuestions = role.questions || [];
      if (roleQuestions.length > 0) {
        if (
          !createPostulationDto.answers ||
          createPostulationDto.answers.length === 0
        ) {
          throw new MissingRequiredAnswersException(createPostulationDto.roleId);
        }

        // Validar que todas las preguntas tienen respuesta
        const answeredQuestionIds = new Set(
          createPostulationDto.answers.map((a) => a.questionId),
        );
        const missingAnswers = roleQuestions.some(
          (q) => !answeredQuestionIds.has(q.id),
        );
        if (missingAnswers) {
          throw new MissingRequiredAnswersException(createPostulationDto.roleId);
        }
      }
    }

    // 10. Determinar estado inicial y deadline según applicationTypes
    let initialStatus;
    let evaluationDeadline: Date | undefined;

    if (hasEvaluation) {
      // Si tiene evaluación técnica, estado inicial es PENDING_EVALUATION
      initialStatus = await this.postulationStatusService.getByCode(
        PostulationStatusCode.PENDING_EVALUATION,
      );

      // Calcular deadline basado en los días de la evaluación
      const evaluation = role.evaluations?.[0];
      const evaluationDays = evaluation?.days || 10;
      evaluationDeadline = new Date();
      evaluationDeadline.setDate(evaluationDeadline.getDate() + evaluationDays);
    } else {
      // Si solo tiene CV y/o preguntas, estado inicial es ACTIVE
      initialStatus = await this.postulationStatusService.getActiveStatus();
    }

    // 11. Crear la postulación
    const postulationData: Partial<Postulation> = {
      userId: currentUserId,
      projectId: role.projectId,
      roleId: createPostulationDto.roleId,
      statusId: initialStatus.id,
      cvUrl: createPostulationDto.cvUrl,
      cvFilename: createPostulationDto.cvFilename,
      cvSize: createPostulationDto.cvSize,
      evaluationDeadline,
      // Campos para inversores
      investorAmount: createPostulationDto.investorAmount,
      investorMessage: createPostulationDto.investorMessage,
      // Campos para socios
      partnerDescription: createPostulationDto.partnerDescription,
    };

    // Si vienen respuestas, crear con answers en una transacción
    if (createPostulationDto.answers && createPostulationDto.answers.length > 0) {
      return await this.postulationRepository.createWithAnswers(
        postulationData,
        createPostulationDto.answers,
      );
    }

    return await this.postulationRepository.create(postulationData);
  }

  /**
   * Valida que el usuario tiene el rol correcto
   * @param currentUserId - ID del usuario actual
   */
  private async validateUserRole(currentUserId: number): Promise<void> {
    try {
      const user = await this.usersClientService.getUserById(currentUserId);
      const userRole =
        await this.usersClientService.getUserRole(currentUserId);

      if (!user || !userRole || userRole.name !== 'user') {
        throw new InvalidUserRoleException(currentUserId);
      }
    } catch {
      throw new InvalidUserRoleException(currentUserId);
    }
  }
}
