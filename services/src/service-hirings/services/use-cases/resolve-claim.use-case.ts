import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../../common/services/email.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { ResolveClaimDto } from '../../dto/resolve-claim.dto';
import { ClaimCompliance } from '../../entities/claim-compliance.entity';
import { Claim } from '../../entities/claim.entity';
import { ClaimStatus } from '../../enums/claim.enum';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ClaimRepository } from '../../repositories/claim.repository';
import { ServiceHiringStatusRepository } from '../../repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';
import { CreateComplianceUseCase } from './compliance/create-compliance.use-case';

@Injectable()
export class ResolveClaimUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly hiringStatusRepository: ServiceHiringStatusRepository,
    private readonly emailService: EmailService,
    private readonly usersClient: UsersClientService,
    private readonly createComplianceUseCase: CreateComplianceUseCase,
  ) {}

  async execute(
    claimId: string,
    resolvedBy: number,
    resolveDto: ResolveClaimDto,
  ): Promise<{ claim: Claim; compliances: ClaimCompliance[] }> {
    const {
      status,
      resolution,
      resolutionType,
      partialAgreementDetails,
      compliances,
    } = resolveDto;

    // 1. Verificar que el claim existe
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    // 2. Reglas de flujo: primero debe estar en IN_REVIEW o esperando respuesta del staff
    if (
      claim.status !== ClaimStatus.IN_REVIEW &&
      claim.status !== ClaimStatus.REQUIRES_STAFF_RESPONSE
    ) {
      throw new BadRequestException(
        'El reclamo debe estar "en revisión" o "requiere respuesta" para poder resolverlo o rechazarlo',
      );
    }

    // 3. Validar compliances si se proporcionaron
    if (compliances && compliances.length > 0) {
      // Solo se pueden crear compliances si el status es 'resolved'
      if (status === ClaimStatus.REJECTED) {
        throw new BadRequestException(
          'No se pueden asignar compliances a un reclamo rechazado',
        );
      }

      // Validar que los usuarios responsables son parte del reclamo
      await this.validateComplianceResponsibles(claim, compliances);
    }

    // 4. Resolver el reclamo
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

    // 5. Determinar el estado final del hiring según el tipo de resolución
    await this.updateHiringStatusByResolution(
      claim.hiringId,
      status,
      resolutionType,
    );

    // 6. Crear compliances si fueron proporcionados
    const createdCompliances: ClaimCompliance[] = [];
    if (
      compliances &&
      compliances.length > 0 &&
      status === ClaimStatus.RESOLVED
    ) {
      for (const complianceData of compliances) {
        try {
          const compliance = await this.createComplianceUseCase.execute({
            claimId: updatedClaim.id,
            responsibleUserId: complianceData.responsibleUserId,
            complianceType: complianceData.complianceType,
            moderatorInstructions: complianceData.instructions,
            deadlineDays: complianceData.deadlineDays,
            order: complianceData.order,
          });
          createdCompliances.push(compliance);
        } catch (error) {
          console.error(
            `[ResolveClaimUseCase] Error al crear compliance para usuario ${complianceData.responsibleUserId}:`,
            error,
          );
          // Continuamos con los demás compliances aunque uno falle
        }
      }
    }

    // 7. Enviar notificaciones por email
    await this.sendResolutionNotifications(updatedClaim, createdCompliances);

    return {
      claim: updatedClaim,
      compliances: createdCompliances,
    };
  }

  /**
   * Valida que los usuarios responsables de los compliances sean parte del reclamo
   */
  private async validateComplianceResponsibles(
    claim: Claim,
    compliances: Array<{ responsibleUserId: number }>,
  ): Promise<void> {
    // Obtener el hiring para conocer el userId (cliente)
    const hiring = await this.hiringRepository.findById(claim.hiringId);
    if (!hiring) {
      throw new NotFoundException(
        `Contratación con ID ${claim.hiringId} no encontrada`,
      );
    }

    const clientId = hiring.userId;
    const providerId = hiring.service.userId;

    // Validar cada responsable
    for (const compliance of compliances) {
      const userId = compliance.responsibleUserId;
      if (userId !== clientId && userId !== providerId) {
        throw new BadRequestException(
          `El usuario ${userId} no es parte del reclamo. Solo pueden ser asignados el cliente (${clientId}) o el proveedor (${providerId})`,
        );
      }
    }
  }

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
  }

  /**
   * Envía notificaciones de email al cliente y proveedor sobre la resolución
   */
  private async sendResolutionNotifications(
    claim: Claim,
    compliances: ClaimCompliance[] = [],
  ): Promise<void> {
    try {
      // Obtener el hiring con la relación service
      const hiring = await this.hiringRepository.findById(claim.hiringId);
      if (!hiring) {
        console.error(
          '[ResolveClaimUseCase] No se pudo obtener el hiring para enviar notificaciones',
        );
        return;
      }

      // Obtener información del cliente (con profile)
      const client = await this.usersClient.getUserByIdWithRelations(
        hiring.userId,
      );
      const clientName = client?.profile
        ? `${client.profile.name} ${client.profile.lastName}`.trim()
        : 'Cliente';

      // Obtener información del proveedor (con profile)
      const provider = await this.usersClient.getUserByIdWithRelations(
        hiring.service.userId,
      );
      const providerName = provider?.profile
        ? `${provider.profile.name} ${provider.profile.lastName}`.trim()
        : 'Proveedor';

      const claimData = {
        claimId: claim.id,
        hiringTitle: hiring.service.title,
        status: claim.status as 'resolved' | 'rejected',
        resolution: claim.resolution || '',
        resolutionType: claim.resolutionType,
      };

      // Enviar email al cliente
      if (client?.email) {
        // Filtrar compliances asignados al cliente
        const clientCompliances = compliances.filter(
          (c) => Number(c.responsibleUserId) === hiring.userId,
        );

        await this.emailService.sendClaimResolvedEmail(
          client.email,
          clientName,
          claimData,
          clientCompliances,
        );

        // Ya no enviamos email adicional, todo va en sendClaimResolvedEmail
      }

      // Enviar email al proveedor
      if (provider?.email) {
        // Filtrar compliances asignados al proveedor
        const providerCompliances = compliances.filter(
          (c) => Number(c.responsibleUserId) === hiring.service.userId,
        );

        await this.emailService.sendClaimResolvedEmail(
          provider.email,
          providerName,
          claimData,
          providerCompliances,
        );

        // Ya no enviamos email adicional, todo va en sendClaimResolvedEmail
      }
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
  async markAsInReview(
    claimId: string,
    moderatorId: number,
    moderatorEmail: string | null,
  ): Promise<Claim> {
    const claim = await this.claimRepository.findById(claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${claimId} no encontrado`);
    }

    if (claim.status !== ClaimStatus.OPEN) {
      throw new BadRequestException(
        'Solo se pueden marcar como "en revisión" los reclamos abiertos',
      );
    }

    // 1) siempre marcar status
    const updated = await this.claimRepository.update(claimId, {
      status: ClaimStatus.IN_REVIEW,
    });

    // 2) asignar moderador solo si aún no existe
    await this.claimRepository.assignModeratorIfEmpty(
      claimId,
      moderatorId,
      moderatorEmail,
    );

    const refreshed = await this.claimRepository.findById(claimId);

    if (!updated || !refreshed) {
      throw new Error('Error al actualizar el reclamo');
    }

    return refreshed;
  }
}
