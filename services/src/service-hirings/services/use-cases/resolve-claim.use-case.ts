import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../../common/services/email.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ResolveClaimDto } from '../../dto/resolve-claim.dto';
import { Claim } from '../../entities/claim.entity';
import { ClaimStatus } from '../../enums/claim.enum';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ClaimRepository } from '../../repositories/claim.repository';
import { ServiceHiringStatusRepository } from '../../repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class ResolveClaimUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly hiringStatusRepository: ServiceHiringStatusRepository,
    private readonly emailService: EmailService,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(
    claimId: string,
    resolvedBy: number,
    resolveDto: ResolveClaimDto,
  ): Promise<Claim> {
    const { status, resolution, resolutionType, partialAgreementDetails } =
      resolveDto;

    // 1. Verificar que el claim existe
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    // 2. Verificar que el claim está en estado OPEN, IN_REVIEW o PENDING_CLARIFICATION
    if (
      claim.status !== ClaimStatus.OPEN &&
      claim.status !== ClaimStatus.IN_REVIEW &&
      claim.status !== ClaimStatus.PENDING_CLARIFICATION
    ) {
      throw new BadRequestException(
        `El reclamo ya fue ${claim.status === ClaimStatus.RESOLVED ? 'resuelto' : 'rechazado'}`,
      );
    }

    // 3. Resolver el reclamo
    const updatedClaim = await this.claimRepository.resolve(
      claimId,
      status,
      resolution,
      resolvedBy,
      resolutionType,
      partialAgreementDetails,
    );

    if (!updatedClaim) {
      throw new Error('Error al resolver el reclamo');
    }

    // 4. Determinar el estado final del hiring según el tipo de resolución
    await this.updateHiringStatusByResolution(
      claim.hiringId,
      status,
      resolutionType,
    );

    console.log(
      `[ResolveClaimUseCase] Reclamo ${claimId} resuelto como ${status} (${resolutionType}) por usuario ${resolvedBy}`,
    );

    // 5. Enviar notificaciones por email
    await this.sendResolutionNotifications(updatedClaim);

    return updatedClaim;
  }

  /**
   * Actualiza el estado del hiring según el tipo de resolución del reclamo
   */
  private async updateHiringStatusByResolution(
    hiringId: number,
    claimStatus: ClaimStatus.RESOLVED | ClaimStatus.REJECTED,
    resolutionType: string,
  ): Promise<void> {
    // Si el reclamo fue rechazado, restaurar al estado anterior
    if (claimStatus === ClaimStatus.REJECTED) {
      const claim = await this.claimRepository.findByHiringId(hiringId);
      const previousStatusId = claim[0]?.previousHiringStatusId;

      if (previousStatusId) {
        await this.hiringRepository.update(hiringId, {
          statusId: previousStatusId,
        });
        console.log(
          `[ResolveClaimUseCase] Hiring ${hiringId} restaurado al estado anterior (statusId: ${previousStatusId})`,
        );
      }
      return;
    }

    // Si el reclamo fue resuelto, determinar el estado final según el tipo
    const statusCodeMap: Record<string, ServiceHiringStatusCode> = {
      client_favor: ServiceHiringStatusCode.CANCELLED_BY_CLAIM,
      provider_favor: ServiceHiringStatusCode.COMPLETED_BY_CLAIM,
      partial_agreement: ServiceHiringStatusCode.COMPLETED_WITH_AGREEMENT,
    };

    const targetStatusCode = statusCodeMap[resolutionType];

    if (!targetStatusCode) {
      console.warn(
        `[ResolveClaimUseCase] Tipo de resolución desconocido: ${resolutionType}`,
      );
      return;
    }

    // Buscar el estado por código
    const targetStatus =
      await this.hiringStatusRepository.findByCode(targetStatusCode);

    if (!targetStatus) {
      console.error(
        `[ResolveClaimUseCase] No se encontró el estado con código: ${targetStatusCode}`,
      );
      return;
    }

    // Actualizar el hiring al estado final
    await this.hiringRepository.update(hiringId, {
      statusId: targetStatus.id,
    });

    console.log(
      `[ResolveClaimUseCase] Hiring ${hiringId} actualizado a estado: ${targetStatus.name} (${targetStatusCode})`,
    );
  }

  /**
   * Envía notificaciones de email al cliente y proveedor sobre la resolución
   */
  private async sendResolutionNotifications(claim: Claim): Promise<void> {
    try {
      // Obtener el hiring con la relación service
      const hiring = await this.hiringRepository.findById(claim.hiringId);
      if (!hiring) {
        console.error(
          '[ResolveClaimUseCase] No se pudo obtener el hiring para enviar notificaciones',
        );
        return;
      }

      // Obtener información del cliente
      const client = await this.usersClient.getUserById(hiring.userId);
      const clientName = client
        ? `${client.name} ${client.lastName}`.trim()
        : 'Cliente';

      // Obtener información del proveedor
      const provider = await this.usersClient.getUserById(
        hiring.service.userId,
      );
      const providerName = provider
        ? `${provider.name} ${provider.lastName}`.trim()
        : 'Proveedor';

      const claimData = {
        claimId: claim.id,
        hiringTitle: hiring.service.title,
        status: claim.status as 'resolved' | 'rejected',
        resolution: claim.resolution || '',
      };

      // Enviar email al cliente
      if (client?.email) {
        await this.emailService.sendClaimResolvedEmail(
          client.email,
          clientName,
          claimData,
        );
      }

      // Enviar email al proveedor
      if (provider?.email) {
        await this.emailService.sendClaimResolvedEmail(
          provider.email,
          providerName,
          claimData,
        );
      }

      console.log(
        '[ResolveClaimUseCase] Notificaciones de resolución enviadas',
      );
    } catch (error) {
      console.error(
        '[ResolveClaimUseCase] Error al enviar notificaciones:',
        error,
      );
      // No lanzamos error para no bloquear la resolución del claim
    }
  }

  /**
   * Permite a un moderador marcar un reclamo como "en revisión"
   */
  async markAsInReview(claimId: string): Promise<Claim> {
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    if (claim.status !== ClaimStatus.OPEN) {
      throw new BadRequestException(
        'Solo se pueden marcar como "en revisión" los reclamos abiertos',
      );
    }

    const updated = await this.claimRepository.update(claimId, {
      status: ClaimStatus.IN_REVIEW,
    });

    if (!updated) {
      throw new Error('Error al actualizar el reclamo');
    }

    return updated;
  }
}
