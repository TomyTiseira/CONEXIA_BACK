import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersClientService } from '../../../common/services/users-client.service';
import { EmailService } from '../../../common/services/email.service';
import { ClaimStatus } from '../../enums/claim.enum';
import { ClaimRepository } from '../../repositories/claim.repository';
import { ServiceHiringRepository } from '../../repositories/service-hiring.repository';

@Injectable()
export class CancelClaimUseCase {
  constructor(
    private readonly claimRepository: ClaimRepository,
    private readonly hiringRepository: ServiceHiringRepository,
    private readonly usersClient: UsersClientService,
    private readonly emailService: EmailService,
  ) {}

  async execute(params: { claimId: string; userId: number }) {
    const claim = await this.claimRepository.findById(params.claimId);
    if (!claim) {
      throw new NotFoundException(`Reclamo con ID ${params.claimId} no encontrado`);
    }

    // Solo el denunciante puede cancelar.
    if (Number(claim.claimantUserId) !== Number(params.userId)) {
      throw new UnauthorizedException('Solo el denunciante puede cancelar el reclamo');
    }

    // No permitir cancelar reclamos cerrados.
    if (
      claim.status === ClaimStatus.RESOLVED ||
      claim.status === ClaimStatus.REJECTED ||
      claim.status === ClaimStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `No se puede cancelar un reclamo en estado ${claim.status}`,
      );
    }

    // En este flujo, cancelar solo tiene sentido si aún no hay decisión final.
    const cancellableStatuses: ClaimStatus[] = [
      ClaimStatus.OPEN,
      ClaimStatus.IN_REVIEW,
      ClaimStatus.PENDING_CLARIFICATION,
      ClaimStatus.REQUIRES_STAFF_RESPONSE,
    ];

    if (!cancellableStatuses.includes(claim.status)) {
      throw new BadRequestException(
        `No se puede cancelar un reclamo en estado ${claim.status}`,
      );
    }

    const updated = await this.claimRepository.update(claim.id, {
      status: ClaimStatus.CANCELLED,
      closedAt: new Date(),
      finalOutcome: 'cancelled_by_claimant',
    } as any);

    if (!updated) {
      throw new Error('Error al cancelar el reclamo');
    }

    // Restaurar el estado del hiring si existe un estado previo.
    if (claim.previousHiringStatusId) {
      await this.hiringRepository.update(claim.hiringId, {
        statusId: claim.previousHiringStatusId,
      });
    }

    // Enviar notificaciones de cancelación.
    await this.sendCancellationNotifications(updated);

    return updated;
  }

  /**
   * Envía emails a:
   * - Claimant (denunciante) confirmación de cancelación.
   * - Respondent (otra parte) notificación de que el reclamo fue cancelado.
   * - Moderador asignado (si existe) notificación de cancelación.
   */
  private async sendCancellationNotifications(claim: any): Promise<void> {
    try {
      const hiring = await this.hiringRepository.findById(claim.hiringId);
      if (!hiring) {
        console.error(
          '[CancelClaimUseCase] No se pudo obtener el hiring para enviar notificaciones',
        );
        return;
      }

      // Identificar IDs de las partes (denunciante y reclamado).
      const claimantUserId = claim.claimantUserId;
      const respondentUserId =
        claim.claimantRole === 'client'
          ? hiring.service?.userId
          : hiring.userId;

      const userIds = [claimantUserId];
      if (respondentUserId) {
        userIds.push(respondentUserId);
      }

      const users = await this.usersClient.getUsersByIds(userIds);
      const usersMap = new Map<number, any>();
      users.forEach((u) => usersMap.set(u.id, u));

      const claimant = usersMap.get(claimantUserId);
      const respondent = respondentUserId
        ? usersMap.get(respondentUserId)
        : null;

      const claimantEmail = claimant?.email;
      const respondentEmail = respondent?.email;
      const claimantName =
        claimant?.profile?.firstName ||
        claimant?.profile?.name ||
        'Usuario';
      const respondentName =
        respondent?.profile?.firstName ||
        respondent?.profile?.name ||
        'Usuario';
      const serviceName = hiring.service?.title || 'el servicio';

      // Email al denunciante (confirmación de cancelación).
      if (claimantEmail) {
        const claimantSubject = `Reclamo cancelado - ${serviceName}`;
        const claimantText = `Hola ${claimantName},\n\nHas cancelado exitosamente tu reclamo sobre la contratación de "${serviceName}".\n\nSi necesitas asistencia adicional, no dudes en contactarnos.\n\nSaludos,\nEquipo de Soporte`;
        const claimantHtml = `
          <h2>Reclamo cancelado</h2>
          <p>Hola <strong>${claimantName}</strong>,</p>
          <p>Has cancelado exitosamente tu reclamo sobre la contratación de <strong>"${serviceName}"</strong>.</p>
          <p>Si necesitas asistencia adicional, no dudes en contactarnos.</p>
          <p>Saludos,<br/>Equipo de Soporte</p>
        `;

        await this.emailService.sendEmail({
          to: claimantEmail,
          subject: claimantSubject,
          text: claimantText,
          html: claimantHtml,
        });
      }

      // Email al reclamado (notificación de cancelación).
      if (respondentEmail) {
        const respondentSubject = `Reclamo cancelado - ${serviceName}`;
        const respondentText = `Hola ${respondentName},\n\nTe informamos que el reclamo relacionado con tu contratación de "${serviceName}" ha sido cancelado por la otra parte.\n\nNo se requiere ninguna acción de tu parte.\n\nSaludos,\nEquipo de Soporte`;
        const respondentHtml = `
          <h2>Reclamo cancelado</h2>
          <p>Hola <strong>${respondentName}</strong>,</p>
          <p>Te informamos que el reclamo relacionado con tu contratación de <strong>"${serviceName}"</strong> ha sido cancelado por la otra parte.</p>
          <p>No se requiere ninguna acción de tu parte.</p>
          <p>Saludos,<br/>Equipo de Soporte</p>
        `;

        await this.emailService.sendEmail({
          to: respondentEmail,
          subject: respondentSubject,
          text: respondentText,
          html: respondentHtml,
        });
      }

      // Email al moderador asignado (si existe).
      const assignedModeratorEmail = (claim as any).assignedModeratorEmail;
      if (assignedModeratorEmail) {
        const moderatorSubject = `Reclamo cancelado por el denunciante - ${serviceName}`;
        const moderatorText = `Hola,\n\nEl reclamo ID ${claim.id} sobre la contratación de "${serviceName}" ha sido cancelado por el denunciante (${claimantName}).\n\nNo se requiere ninguna acción adicional.\n\nSaludos,\nSistema de Reclamos`;
        const moderatorHtml = `
          <h2>Reclamo cancelado por el denunciante</h2>
          <p>Hola,</p>
          <p>El reclamo <strong>ID ${claim.id}</strong> sobre la contratación de <strong>"${serviceName}"</strong> ha sido cancelado por el denunciante (<strong>${claimantName}</strong>).</p>
          <p>No se requiere ninguna acción adicional.</p>
          <p>Saludos,<br/>Sistema de Reclamos</p>
        `;

        await this.emailService.sendEmail({
          to: assignedModeratorEmail,
          subject: moderatorSubject,
          text: moderatorText,
          html: moderatorHtml,
        });
      }
    } catch (error) {
      console.error(
        '[CancelClaimUseCase] Error al enviar notificaciones de cancelación:',
        error,
      );
      // No lanzamos error para no bloquear la cancelación.
    }
  }
}
