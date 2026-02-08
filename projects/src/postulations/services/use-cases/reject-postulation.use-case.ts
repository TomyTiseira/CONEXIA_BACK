import { Injectable } from '@nestjs/common';
import { EmailService, UsersClientService } from 'src/common';
import { RejectPostulationDto } from '../../dtos/reject-postulation.dto';
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
export class RejectPostulationUseCase {
  constructor(
    private readonly postulationValidationService: PostulationValidationService,
    private readonly postulationOperationsService: PostulationOperationsService,
    private readonly usersClientService: UsersClientService,
    private readonly emailService: EmailService,
  ) {}

  async execute(rejectPostulationDto: RejectPostulationDto) {
    // Validar que la postulación existe
    const postulation =
      await this.postulationValidationService.validatePostulationExists(
        rejectPostulationDto.postulationId,
      );

    // Validar que el proyecto está activo
    const project =
      await this.postulationValidationService.validateProjectExistsAndActive(
        postulation.projectId,
      );

    // Validar que el usuario es el dueño del proyecto
    this.postulationValidationService.validateUserIsProjectOwner(
      project,
      rejectPostulationDto.currentUserId,
    );

    // Validar que el postulante esté activo
    await this.postulationValidationService.validateUserIsActive(
      postulation.userId,
    );

    // Rechazar la postulación (el patrón State se encarga de validar el estado)
    const rejectedPostulation =
      await this.postulationOperationsService.rejectPostulation(postulation.id);

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
          .sendPostulationRejectedEmail(
            userWithProfile.user.email,
            userName,
            project.title,
          )
          .catch((error) => {
            console.error(
              'Error al enviar email de postulación rechazada:',
              error,
            );
          });
      }
    } catch (error) {
      console.error(
        'Error al obtener información del usuario para enviar email:',
        error,
      );
    }

    return rejectedPostulation;
  }
}
