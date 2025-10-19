import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../../common/services/email.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { AddObservationsDto } from '../../dto/add-observations.dto';
import { Claim } from '../../entities/claim.entity';
import { ClaimStatus } from '../../enums/claim.enum';
import { ClaimRepository } from '../../repositories/claim.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class AddObservationsUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly emailService: EmailService,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(
    claimId: string,
    moderatorId: number,
    dto: AddObservationsDto,
  ): Promise<Claim> {
    const { observations } = dto;

    // 1. Verificar que el claim existe
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    // 2. Verificar que el claim está en estado OPEN o IN_REVIEW
    if (
      claim.status !== ClaimStatus.OPEN &&
      claim.status !== ClaimStatus.IN_REVIEW
    ) {
      throw new BadRequestException(
        `Solo se pueden agregar observaciones a reclamos en estado OPEN o IN_REVIEW`,
      );
    }

    // 3. Agregar observaciones y cambiar estado a PENDING_CLARIFICATION
    const updatedClaim = await this.claimRepository.addObservations(
      claimId,
      observations,
      moderatorId,
    );

    if (!updatedClaim) {
      throw new Error('Error al agregar observaciones al reclamo');
    }

    console.log(
      `[AddObservationsUseCase] Observaciones agregadas al reclamo ${claimId} por moderador ${moderatorId}`,
    );

    // 4. Enviar notificaciones por email al reclamante
    await this.sendObservationNotifications(updatedClaim);

    return updatedClaim;
  }

  /**
   * Envía notificación de email al reclamante sobre las observaciones
   */
  private async sendObservationNotifications(claim: Claim): Promise<void> {
    try {
      // Obtener información del reclamante
      const claimant = await this.usersClient.getUserByIdWithRelations(
        claim.claimantUserId,
      );
      const claimantName = claimant
        ? `${claimant.name} ${claimant.lastName}`.trim()
        : 'Usuario';

      // Obtener información del hiring
      const hiring = await this.hiringRepository.findById(claim.hiringId);
      if (!hiring) {
        console.error(
          '[AddObservationsUseCase] No se pudo obtener el hiring para enviar notificaciones',
        );
        return;
      }

      if (claimant?.email) {
        // TODO: Implementar sendClaimObservationsEmail en EmailService
        console.log(
          `[AddObservationsUseCase] Email notification would be sent to ${claimant.email}`,
        );
        // await this.emailService.sendClaimObservationsEmail(
        //   claimant.email,
        //   claimantName,
        //   {
        //     claimId: claim.id,
        //     hiringTitle: hiring.service.title,
        //     observations: claim.observations || '',
        //   },
        // );
      }

      console.log(
        '[AddObservationsUseCase] Notificación de observaciones enviada',
      );
    } catch (error) {
      console.error(
        '[AddObservationsUseCase] Error al enviar notificaciones:',
        error,
      );
      // No lanzamos error para no bloquear la adición de observaciones
    }
  }
}
