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
      rejectionCount: number;
    },
  ): Promise<void>;
}
