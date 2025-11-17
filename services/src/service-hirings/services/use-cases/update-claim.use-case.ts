import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from '../../../common/services/email.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { UpdateClaimDto } from '../../dto/update-claim.dto';
import { Claim } from '../../entities/claim.entity';
import { ClaimStatus } from '../../enums/claim.enum';
import { ClaimRepository } from '../../repositories/claim.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class UpdateClaimUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly emailService: EmailService,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(
    claimId: string,
    userId: number,
    updateDto: UpdateClaimDto,
  ): Promise<Claim> {
    const { clarificationResponse, evidenceUrls } = updateDto;

    // 1. Validar que se envíe al menos uno de los dos campos
    if (!clarificationResponse && (!evidenceUrls || evidenceUrls.length === 0)) {
      throw new BadRequestException(
        'Debes proporcionar al menos una respuesta de subsanación o evidencias',
      );
    }

    // 2. Verificar que el claim existe
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    // 3. Verificar que el claim está en estado PENDING_CLARIFICATION
    if (claim.status !== ClaimStatus.PENDING_CLARIFICATION) {
      throw new BadRequestException(
        'Solo se pueden subsanar reclamos en estado "Pendiente de subsanación"',
      );
    }

    // 4. Verificar que el usuario es el denunciante
    if (claim.claimantUserId !== userId) {
      throw new UnauthorizedException(
        'Solo el denunciante puede subsanar el reclamo',
      );
    }

    // 5. Validar que no se excedan los 10 archivos en total
    const existingCount = claim.evidenceUrls?.length || 0;
    const newCount = evidenceUrls?.length || 0;
    if (existingCount + newCount > 10) {
      throw new BadRequestException(
        `No puedes agregar ${newCount} archivos. Ya tienes ${existingCount} y el máximo es 10`,
      );
    }

    // 6. Actualizar el claim
    const updatedClaim = await this.claimRepository.updateClaimEvidence(
      claimId,
      {
        clarificationResponse,
        evidenceUrls,
      },
    );

    if (!updatedClaim) {
      throw new Error('Error al actualizar el reclamo');
    }

    // 7. Notificar a los moderadores que el reclamo fue subsanado
    await this.sendUpdateNotifications(updatedClaim);

    return updatedClaim;
  }

  /**
   * Envía notificaciones de email a moderadores sobre la subsanación
   */
  private async sendUpdateNotifications(claim: Claim): Promise<void> {
    try {
      // Obtener información del hiring
      const hiring = await this.hiringRepository.findById(claim.hiringId);
      if (!hiring) {
        console.error(
          '[UpdateClaimUseCase] No se pudo obtener el hiring para enviar notificaciones',
        );
        return;
      }

      // TODO: Implementar envío de email a moderadores/admins

      // Ejemplo: await this.emailService.sendClaimUpdatedEmail(adminEmail, claimData);
    } catch (error) {
      console.error(
        '[UpdateClaimUseCase] Error al enviar notificaciones:',
        error,
      );
      // No lanzamos error para no bloquear la subsanación
    }
  }
}
