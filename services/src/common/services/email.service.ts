import { Injectable } from '@nestjs/common';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export abstract class EmailService {
  /**
   * Método genérico para enviar emails
   */
  abstract sendEmail(options: EmailOptions): Promise<void>;

  /**
   * Envía un email cuando se crea un reclamo
   */
  abstract sendClaimCreatedEmail(
    recipientEmail: string,
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      claimType: string;
      claimantName: string;
      claimantRole: 'client' | 'provider';
      description: string;
    },
  ): Promise<void>;

  abstract sendClaimCreatedConfirmationEmail(
    recipientEmail: string,
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      claimType: string;
      claimantName: string;
      claimantRole: 'client' | 'provider';
      description: string;
    },
  ): Promise<void>;

  /**
   * Envía un email cuando se resuelve un reclamo
   */
  abstract sendClaimResolvedEmail(
    recipientEmail: string,
    recipientName: string,
    recipientUserId: number,
    claimData: {
      claimId: string;
      hiringTitle: string;
      status: 'resolved' | 'rejected';
      resolution: string;
      resolutionType?: string | null;
    },
    compliances?: any[],
  ): Promise<void>;

  /**
   * Envía un email a admins/moderadores cuando hay un nuevo reclamo
   */
  abstract sendClaimCreatedAdminEmail(
    adminEmail: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      claimType: string;
      claimantName: string;
      claimantRole: 'client' | 'provider';
      description: string;
    },
  ): Promise<void>;

  /**
   * Envía un email al cliente cuando su servicio contratado es terminado por moderación
   */
  abstract sendServiceTerminatedByModerationEmail(
    clientEmail: string,
    clientName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      providerName: string;
      reason: string;
    },
  ): Promise<void>;

  /**
   * Envía un email al proveedor cuando el cliente que contrató su servicio es baneado
   */
  abstract sendServiceTerminatedClientBannedEmail(
    providerEmail: string,
    providerName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      clientName: string;
      reason: string;
    },
  ): Promise<void>;

  /**
   * Envía un email cuando se asignan compliances al resolver un reclamo
   */
  abstract sendComplianceCreatedEmail(
    recipientEmail: string,
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      status: 'resolved' | 'rejected';
      resolution: string;
      resolutionType?: string | null;
    },
    compliances: Array<{
      id: string;
      complianceType: string;
      moderatorInstructions: string;
      deadline: Date;
      originalDeadlineDays: number;
    }>,
  ): Promise<void>;

  /**
   * Envía un email cuando el usuario envía evidencia de cumplimiento
   */
  abstract sendComplianceSubmittedEmail(
    moderatorEmail: string,
    responsibleUserName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      userNotes?: string | null;
      evidenceUrls?: string[] | null;
    },
  ): Promise<void>;

  /**
   * Envía un email cuando el moderador aprueba un compliance
   */
  abstract sendComplianceApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      moderatorNotes?: string | null;
    },
  ): Promise<void>;

  /**
   * Envía un email cuando el moderador rechaza un compliance
   */
  abstract sendComplianceRejectedEmail(
    recipientEmail: string,
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      rejectionReason?: string | null;
      moderatorNotes?: string | null;
      rejectionCount: number;
      attemptsLeft?: number;
      newDeadline?: string;
      isSecondRejection?: boolean;
      complianceLabel?: string;
      isOtherPartyEmail?: boolean;
    },
  ): Promise<void>;

  /**
   * Envía un email a ambas partes cuando se sube evidencia de cumplimiento
   */
  abstract sendComplianceEvidenceUploadedEmail(
    recipientEmail: string,
    recipientName: string,
    uploaderName: string,
    isResponsibleUser: boolean,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      userNotes?: string | null;
      attemptNumber: number;
    },
  ): Promise<void>;

  /**
   * Envía un email cuando la otra parte aprueba el compliance (peer review)
   */
  abstract sendCompliancePeerApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    peerReviewerName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      peerReviewReason?: string | null;
    },
  ): Promise<void>;

  /**
   * Envía un email cuando la otra parte rechaza el compliance (peer review)
   */
  abstract sendCompliancePeerRejectedEmail(
    recipientEmail: string,
    recipientName: string,
    peerReviewerName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      peerReviewReason?: string | null;
    },
  ): Promise<void>;

  /**
   * Envía un email al moderador cuando se realiza una peer review (pre-aprobación o objeción)
   */
  abstract sendPeerReviewToModeratorEmail(
    moderatorEmail: string,
    responsibleUserName: string,
    peerReviewerName: string,
    peerReviewStatus: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      peerReviewReason?: string | null;
    },
  ): Promise<void>;

  /**
   * Envía advertencia cuando faltan menos de 24 horas para el deadline
   */
  abstract sendComplianceDeadlineWarningEmail(
    recipientEmail: string,
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      deadline: Date;
      hoursRemaining: number;
      moderatorInstructions: string;
    },
  ): Promise<void>;

  /**
   * Envía email cuando el deadline ha pasado (período de gracia)
   */
  abstract sendComplianceOverdueEmail(
    recipientEmail: string,
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      originalDeadline: Date;
      extendedDeadline: Date;
      daysExtended: number;
      moderatorInstructions: string;
    },
  ): Promise<void>;

  /**
   * Envía email crítico cuando está en WARNING (segunda extensión)
   */
  abstract sendComplianceWarningEmail(
    recipientEmail: string,
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      finalDeadline: Date;
      moderatorInstructions: string;
    },
  ): Promise<void>;

  /**
   * Envía email cuando se escala a administradores (preparación para sanción)
   */
  abstract sendComplianceEscalatedEmail(
    recipientEmail: string,
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      moderatorInstructions: string;
      deadline: Date;
      extendedDeadline?: Date;
      finalDeadline?: Date;
    },
  ): Promise<void>;

  /**
   * Notifica al moderador sobre compliance escalado
   */
  abstract sendModeratorEscalationNotification(
    moderatorEmail: string,
    moderatorName: string,
    responsibleUserName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      warningLevel: number;
      moderatorInstructions: string;
    },
  ): Promise<void>;

  /**
   * Notifica a la otra parte sobre el incumplimiento
   */
  abstract sendComplianceNonComplianceNotification(
    recipientEmail: string,
    recipientName: string,
    responsibleUserName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      warningLevel: number;
      moderatorInstructions?: string;
    },
  ): Promise<void>;
}
