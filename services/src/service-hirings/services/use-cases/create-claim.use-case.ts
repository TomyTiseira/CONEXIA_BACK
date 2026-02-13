import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmailService } from '../../../common/services/email.service';
import { UsersClientService } from '../../../common/services/users-client.service';
import { CreateClaimDto } from '../../dto/create-claim.dto';
import { Claim } from '../../entities/claim.entity';
import {
  ClaimRole,
  ClaimTypeLabels,
  ClaimTypesByRole,
} from '../../enums/claim.enum';
import { ServiceHiringStatusCode } from '../../enums/service-hiring-status.enum';
import { ClaimRepository } from '../../repositories/claim.repository';
import { ServiceHiringStatusRepository } from '../../repositories/service-hiring-status.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class CreateClaimUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly statusRepository: ServiceHiringStatusRepository,
    private readonly emailService: EmailService,
    private readonly usersClient: UsersClientService,
  ) {}

  async execute(
    userId: number,
    createClaimDto: CreateClaimDto,
  ): Promise<Claim> {
    const { hiringId, claimType, description, evidenceUrls, otherReason } =
      createClaimDto;

    // 1. Verificar que el hiring existe (con la relación service para obtener el proveedor)
    const hiring = await this.hiringRepository.findById(parseInt(hiringId));
    if (!hiring) {
      throw new NotFoundException(
        `No se encontró la contratación con ID ${hiringId}`,
      );
    }

    // 2. Verificar que el usuario es parte del hiring (cliente o proveedor)
    const isClient = hiring.userId === userId;
    const isProvider = hiring.service?.userId === userId;

    if (!isClient && !isProvider) {
      throw new ForbiddenException(
        'Solo el cliente o el proveedor pueden crear reclamos',
      );
    }

    const claimantRole = isClient ? ClaimRole.CLIENT : ClaimRole.PROVIDER;

    // 3. Verificar que el tipo de reclamo es válido para el rol
    const allowedTypes = ClaimTypesByRole[claimantRole];
    if (!allowedTypes.includes(claimType)) {
      throw new BadRequestException(
        `El tipo de reclamo "${claimType}" no es válido para su rol`,
      );
    }

    // Validación defensiva: si el tipo es *_other, exigir otherReason
    const isOther =
      claimType === ('client_other' as any) ||
      claimType === ('provider_other' as any);
    if (isOther && !otherReason?.trim()) {
      throw new BadRequestException(
        'El campo "otherReason" es requerido cuando el motivo es "Otro"',
      );
    }

    // 4. Verificar que el hiring está en un estado válido para reclamos
    const allowedStatuses = [
      ServiceHiringStatusCode.IN_PROGRESS,
      ServiceHiringStatusCode.APPROVED,
      ServiceHiringStatusCode.REVISION_REQUESTED,
      ServiceHiringStatusCode.DELIVERED,
      ServiceHiringStatusCode.COMPLETED, // Permitir reclamos después de completado (período de garantía)
    ];

    if (!allowedStatuses.includes(hiring.status.code)) {
      throw new BadRequestException(
        `No se pueden crear reclamos cuando el servicio está en estado "${hiring.status.name}"`,
      );
    }

    // 5. Verificar que no existe un reclamo activo
    const hasActiveClaim = await this.claimRepository.hasActiveClaim(hiring.id);
    if (hasActiveClaim) {
      throw new BadRequestException(
        'Ya existe un reclamo activo para esta contratación',
      );
    }

    // 6. Guardar el estado actual del hiring antes de cambiarlo
    const previousStatusId = hiring.statusId;

    // 7. Crear el reclamo (guardando el estado anterior para poder restaurarlo)
    const claim = await this.claimRepository.create({
      hiringId: hiring.id,
      claimantUserId: userId,
      claimantRole,
      claimType,
      description,
      ...(otherReason ? { otherReason } : {}),
      evidenceUrls: evidenceUrls || [],
      previousHiringStatusId: previousStatusId,
    });

    // 8. Cambiar el hiring a estado IN_CLAIM
    const inClaimStatus = await this.statusRepository.findByCode(
      ServiceHiringStatusCode.IN_CLAIM,
    );
    if (!inClaimStatus) {
      throw new Error('Estado IN_CLAIM no encontrado en la base de datos');
    }

    await this.hiringRepository.update(hiring.id, {
      statusId: inClaimStatus.id,
    });

    console.log(
      `[CreateClaimUseCase] Reclamo creado: ${claim.id} - Hiring ${hiringId} cambiado a IN_CLAIM`,
    );

    // 9. Enviar notificaciones por email
    await this.sendClaimNotifications(claim, hiring, userId);

    return claim;
  }

  /**
   * Envía notificaciones de email al cliente, proveedor y admins
   */
  private async sendClaimNotifications(
    claim: Claim,
    hiring: any,
    claimantUserId: number,
  ): Promise<void> {
    try {
      // Obtener información del usuario reclamante (con profile para obtener name y lastName)
      const claimant =
        await this.usersClient.getUserByIdWithRelations(claimantUserId);
      const claimantName = claimant?.profile
        ? `${claimant.profile.name} ${claimant.profile.lastName}`.trim()
        : 'Usuario';

      // Obtener información del proveedor (con profile)
      const provider = await this.usersClient.getUserByIdWithRelations(
        hiring.service.userId,
      );
      const providerName = provider?.profile
        ? `${provider.profile.name} ${provider.profile.lastName}`.trim()
        : 'Proveedor';

      // Obtener información del cliente (con profile)
      const client = await this.usersClient.getUserByIdWithRelations(
        hiring.userId,
      );
      const clientName = client?.profile
        ? `${client.profile.name} ${client.profile.lastName}`.trim()
        : 'Cliente';

      const claimData = {
        claimId: claim.id,
        hiringTitle: hiring.service.title,
        claimType: ClaimTypeLabels[claim.claimType],
        claimantName,
        claimantRole: claim.claimantRole,
        description: claim.description,
      };

      // Enviar email al reclamante confirmando que su reclamo fue creado
      if (claimant?.email) {
        await this.emailService.sendClaimCreatedConfirmationEmail(
          claimant.email,
          claimantName,
          claimData,
        );
      }

      // Determinar quién recibe el email según el rol del reclamante
      if (claim.claimantRole === ClaimRole.CLIENT) {
        // Cliente reclama → notificar al proveedor
        if (provider?.email) {
          await this.emailService.sendClaimCreatedEmail(
            provider.email,
            providerName,
            claimData,
          );
        }
      } else {
        // Proveedor reclama → notificar al cliente
        if (client?.email) {
          await this.emailService.sendClaimCreatedEmail(
            client.email,
            clientName,
            claimData,
          );
        }
      }

      // Enviar notificación a admins/moderadores
      // TODO: Obtener lista de admins desde users-service
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@conexia.com';
      await this.emailService.sendClaimCreatedAdminEmail(adminEmail, claimData);

      console.log('[CreateClaimUseCase] Notificaciones de email enviadas');
    } catch (error) {
      console.error(
        '[CreateClaimUseCase] Error al enviar notificaciones:',
        error,
      );
      // No lanzamos error para no bloquear la creación del claim
    }
  }
}
