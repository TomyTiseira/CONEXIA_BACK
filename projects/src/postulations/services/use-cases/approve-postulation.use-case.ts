import { Injectable } from '@nestjs/common';
import { EmailService, UsersClientService } from 'src/common';
import { ApprovePostulationDto } from 'src/postulations/dtos/approve-postulation.dto';
import { PostulationOperationsService } from '../postulation-operations.service';
import { PostulationValidationService } from '../postulation-validation.service';

interface UserProfile {
  name?: string;
  lastName?: string;
}

interface User {
  email: string;
}

interface UserWithProfile {
  user: User;
  profile?: UserProfile;
}

@Injectable()
export class ApprovePostulationUseCase {
  constructor(
    private readonly postulationValidationService: PostulationValidationService,
    private readonly postulationOperationsService: PostulationOperationsService,
    private readonly usersClientService: UsersClientService,
    private readonly emailService: EmailService,
  ) {}

  async execute(approvePostulationDto: ApprovePostulationDto) {
    // Validar que la postulación existe
    const postulation =
      await this.postulationValidationService.validatePostulationExists(
        approvePostulationDto.postulationId,
      );

    // Validar que el proyecto está activo
    const project =
      await this.postulationValidationService.validateProjectExistsAndActive(
        postulation.projectId,
      );

    // Validar que el usuario es el dueño del proyecto
    this.postulationValidationService.validateUserIsProjectOwner(
      project,
      approvePostulationDto.currentUserId,
    );

    // Validar que la postulación está en estado pendiente
    await this.postulationValidationService.validatePostulationIsPending(
      postulation,
    );

    // Validar que el proyecto no ha terminado
    this.postulationValidationService.validateProjectNotEnded(project);

    // Validar que el proyecto tiene slots disponibles (si tiene maxCollaborators > 0)
    if (project.maxCollaborators && project.maxCollaborators > 0) {
      await this.postulationValidationService.validateProjectHasAvailableSlots(
        postulation.projectId,
        project.maxCollaborators,
      );
    }

    // Validar que el postulante este activo
    await this.postulationValidationService.validateUserIsActive(
      postulation.userId,
    );

    // Aprobar la postulación
    const approvedPostulation =
      await this.postulationOperationsService.approvePostulation(
        postulation.id,
      );

    // Obtener información del usuario para enviar el email
    try {
      const userWithProfile = (await this.usersClientService.getUserWithProfile(
        postulation.userId,
      )) as UserWithProfile | null;

      if (
        userWithProfile &&
        userWithProfile.user &&
        userWithProfile.user.email
      ) {
        const userName =
          userWithProfile.profile?.name ||
          userWithProfile.user.email.split('@')[0];

        // Enviar email de notificación (de forma asíncrona)
        this.emailService
          .sendPostulationApprovedEmail(
            userWithProfile.user.email,
            userName,
            project.title,
          )
          .catch((error) => {
            console.error(
              'Error al enviar email de postulación aprobada:',
              error,
            );
          });
      } else {
        console.log(
          'No se pudo obtener información del usuario para enviar email',
        );
      }
    } catch (error) {
      console.error(
        'Error al obtener información del usuario para enviar email:',
        error,
      );
    }

    return approvedPostulation;
  }
}
