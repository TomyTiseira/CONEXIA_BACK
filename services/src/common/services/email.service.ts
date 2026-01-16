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
}
