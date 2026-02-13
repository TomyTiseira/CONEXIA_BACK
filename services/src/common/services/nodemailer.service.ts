import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailOptions, EmailService } from './email.service';

@Injectable()
export class NodemailerService extends EmailService {
  private readonly logger = new Logger(NodemailerService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    super();
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER || '';
    const smtpPass = process.env.SMTP_PASS || '';

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    // Verificar la conexión
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Error al verificar la conexión SMTP:', error);
      } else {
        this.logger.log('Servidor SMTP listo para enviar emails (Claims)');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const emailFrom = process.env.EMAIL_FROM || 'noreply@conexia.com';

    // Enviar email de forma asíncrona sin bloquear la respuesta
    this.transporter
      .sendMail({
        from: emailFrom,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      .then((info) => {
        this.logger.log(
          `[Claims] Email enviado a ${options.to}: ${info.messageId}`,
        );
      })
      .catch((error) => {
        this.logger.error('[Claims] Error al enviar email:', error);
      });

    return Promise.resolve();
  }

  /**
   * Helper method para obtener el label en español del tipo de compliance
   */
  private getComplianceTypeLabel(complianceType: string): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      additional_delivery: 'Entrega adicional',
      corrected_delivery: 'Entrega corregida',
      other: 'Otro',
    };

    return complianceTypeLabels[complianceType] || complianceType;
  }

  async sendClaimCreatedEmail(
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
  ): Promise<void> {
    const isRecipientClient = claimData.claimantRole === 'provider';
    const roleLabel = isRecipientClient ? 'proveedor' : 'cliente';

    await this.sendEmail({
      to: recipientEmail,
      subject: `⚠️ Nuevo Reclamo - ${claimData.hiringTitle}`,
      html: this.generateClaimCreatedEmailHTML(
        recipientName,
        roleLabel,
        claimData,
      ),
      text: this.generateClaimCreatedEmailText(
        recipientName,
        roleLabel,
        claimData,
      ),
    });
  }

  async sendClaimCreatedConfirmationEmail(
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
  ): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: `✅ Tu reclamo ha sido creado - ${claimData.hiringTitle}`,
      html: this.generateClaimConfirmationEmailHTML(recipientName, claimData),
      text: this.generateClaimConfirmationEmailText(recipientName, claimData),
    });
  }

  async sendClaimResolvedEmail(
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
    compliances: any[] = [],
  ): Promise<void> {
    const statusLabel =
      claimData.status === 'resolved' ? 'Resuelto' : 'Rechazado';

    // Debug: Log para verificar datos
    this.logger.log(`[sendClaimResolvedEmail] Enviando a: ${recipientEmail}`);
    this.logger.log(
      `[sendClaimResolvedEmail] recipientUserId: ${recipientUserId}`,
    );
    this.logger.log(
      `[sendClaimResolvedEmail] Total compliances: ${compliances.length}`,
    );
    compliances.forEach((c, i) => {
      this.logger.log(
        `[sendClaimResolvedEmail] Compliance ${i}: responsibleUserId=${c.responsibleUserId}, type=${c.complianceType}`,
      );
    });

    await this.sendEmail({
      to: recipientEmail,
      subject: `Reclamo ${statusLabel} - ${claimData.hiringTitle}`,
      html: this.generateClaimResolvedEmailHTML(
        recipientName,
        recipientUserId,
        statusLabel,
        claimData,
        compliances,
      ),
      text: this.generateClaimResolvedEmailText(
        recipientName,
        recipientUserId,
        statusLabel,
        claimData,
        compliances,
      ),
    });
  }

  async sendClaimCreatedAdminEmail(
    adminEmail: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      claimType: string;
      claimantName: string;
      claimantRole: 'client' | 'provider';
      description: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: adminEmail,
      subject: `🚨 [ADMIN] Nuevo Reclamo - ${claimData.hiringTitle}`,
      html: this.generateClaimCreatedAdminEmailHTML(claimData),
      text: this.generateClaimCreatedAdminEmailText(claimData),
    });
  }

  async sendClaimFinishedByModerationEmail(
    recipientEmail: string,
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      reason: string;
      frontendUrl?: string | null;
    },
  ): Promise<void> {
    const frontendUrl = (claimData.frontendUrl || '').trim();
    const claimUrl = frontendUrl
      ? `${frontendUrl.replace(/\/$/, '')}/claims/${claimData.claimId}`
      : `https://conexia.com/claims/${claimData.claimId}`;

    await this.sendEmail({
      to: recipientEmail,
      subject: `Actualización importante sobre tu reclamo - ${claimData.hiringTitle}`,
      html: this.generateClaimFinishedByModerationEmailHTML(recipientName, {
        ...claimData,
        claimUrl,
      }),
      text: this.generateClaimFinishedByModerationEmailText(recipientName, {
        ...claimData,
        claimUrl,
      }),
    });
  }

  async sendServiceTerminatedByModerationEmail(
    clientEmail: string,
    clientName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      providerName: string;
      reason: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: clientEmail,
      subject: `Actualización importante sobre tu contratación: ${serviceData.serviceTitle}`,
      html: this.generateServiceTerminatedEmailHTML(clientName, serviceData),
      text: this.generateServiceTerminatedEmailText(clientName, serviceData),
    });
  }

  // ===== HTML Templates =====

  private generateClaimCreatedEmailHTML(
    recipientName: string,
    roleLabel: string,
    claimData: any,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff4953; margin: 0;">⚠️ Nuevo Reclamo</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            El <strong>${roleLabel}</strong> ha creado un reclamo para el servicio:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${claimData.hiringTitle}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Motivo:</strong> ${claimData.claimType}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Reclamante:</strong> ${claimData.claimantName}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Importante:</strong>
            </p> El servicio quedará pausado hasta que un moderador resuelva el reclamo.
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <strong>Descripción del problema:</strong><br>
            ${claimData.description}
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/${claimData.claimId}" 
               style="display: inline-block; background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Ver Detalles del Reclamo
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Recibirás una notificación cuando el reclamo sea resuelto.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private generateClaimConfirmationEmailHTML(
    recipientName: string,
    claimData: any,
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #28a745; margin: 0;">✅ Reclamo Creado Exitosamente</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Tu reclamo ha sido creado y registrado exitosamente:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${claimData.hiringTitle}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>ID Reclamo:</strong> ${claimData.claimId}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Motivo:</strong> ${claimData.claimType}</p>
          </div>
          
          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460; font-size: 14px;">
              <strong>ℹ️ ¿Qué sucede ahora?</strong>
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #0c5460; font-size: 14px;">
              <li>El servicio quedará pausado hasta que un moderador revise tu reclamo</li>
              <li>Un moderador analizará las evidencias presentadas</li>
              <li>Recibirás notificaciones sobre el progreso del reclamo</li>
              <li>Te informaremos cuando se tome una decisión</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <strong>Tu descripción:</strong><br>
            ${claimData.description}
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/${claimData.claimId}" 
               style="display: inline-block; background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Ver Estado del Reclamo
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Si el moderador necesita información adicional, recibirás un email solicitando aclaraciones.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  private generateClaimResolvedEmailHTML(
    recipientName: string,
    recipientUserId: number,
    statusLabel: string,
    claimData: any,
    compliances: any[] = [],
  ): string {
    const statusColor = claimData.status === 'resolved' ? '#28a745' : '#ff4953';

    // Mapear tipo de resolución a texto legible
    const resolutionTypeLabels: Record<
      string,
      { label: string; description: string }
    > = {
      client_favor: {
        label: 'A favor del cliente',
        description:
          'El servicio ha sido cancelado y el cliente no realizará el pago.',
      },
      provider_favor: {
        label: 'A favor del proveedor',
        description:
          'El servicio se marca como finalizado y el proveedor recibirá el pago completo.',
      },
      partial_agreement: {
        label: 'Acuerdo parcial',
        description:
          'Ambas partes llegaron a un acuerdo. Se aplicarán los términos negociados.',
      },
    };

    const resolutionInfo =
      claimData.resolutionType && resolutionTypeLabels[claimData.resolutionType]
        ? resolutionTypeLabels[claimData.resolutionType]
        : null;

    // Generar HTML de compliances si existen
    let compliancesHTML = '';
    if (compliances && compliances.length > 0) {
      const complianceTypeLabels: Record<string, string> = {
        // Compromisos monetarios
        full_refund: 'Reembolso total',
        partial_refund: 'Reembolso parcial',
        payment_required: 'Pago requerido',
        partial_payment: 'Pago parcial',
        // Compromisos de trabajo
        work_completion: 'Completar trabajo',
        work_revision: 'Revisión de trabajo',
        full_redelivery: 'Reentrega completa',
        corrected_delivery: 'Entrega corregida',
        additional_delivery: 'Entrega adicional',
        // Documentación
        evidence_upload: 'Subir evidencia',
        // Finalización
        confirmation_only: 'Solo confirmación',
        other: 'Otro',
      };

      // Separar compromisos propios de ajenos (comparar como números)
      const myCompliances = compliances.filter(
        (c) => Number(c.responsibleUserId) === Number(recipientUserId),
      );
      const otherCompliances = compliances.filter(
        (c) => Number(c.responsibleUserId) !== Number(recipientUserId),
      );

      // Construir el HTML final
      compliancesHTML =
        '<div style="margin: 30px 0; border-top: 2px solid #e0e0e0; padding-top: 25px;">';

      // Generar lista de mis compromisos
      if (myCompliances.length > 0) {
        compliancesHTML += `
          <div style="margin-bottom: 30px;">
            <h3 style="color: #d9534f; margin: 0 0 10px 0; font-size: 16px;">Tus compromisos (${myCompliances.length})</h3>
            <p style="color: #666; font-size: 14px; margin: 10px 0 20px 0;">
              Como parte de la resolución, debes cumplir con los siguientes compromisos:
            </p>
        `;

        myCompliances.forEach((c, index) => {
          const deadline = c.deadline
            ? new Date(c.deadline).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'No especificado';
          const typeLabel =
            complianceTypeLabels[c.complianceType] || c.complianceType;

          compliancesHTML += `
            <div style="background-color: #fff5f5; padding: 18px; border-left: 5px solid #d9534f; margin: 12px 0; border-radius: 4px;">
              <div style="margin-bottom: 10px;">
                <span style="background-color: #d9534f; color: white; padding: 4px 10px; border-radius: 3px; font-size: 12px; font-weight: bold;">COMPROMISO ${index + 1}</span>
              </div>
              <p style="margin: 10px 0 0 0; color: #333; font-weight: bold; font-size: 15px;">${typeLabel}</p>
              ${c.moderatorInstructions ? `<p style="margin: 10px 0; color: #555; font-size: 14px; line-height: 1.5;"><strong>Instrucciones:</strong><br>${c.moderatorInstructions}</p>` : ''}
              <p style="margin: 10px 0 0 0; color: #d9534f; font-size: 13px;"><strong>Plazo límite:</strong> ${deadline}</p>
            </div>
          `;
        });

        compliancesHTML += `
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin-top: 15px; border: 1px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 13px;">
                <strong>Importante:</strong> Debes cumplir con estos compromisos dentro de los plazos establecidos. El incumplimiento puede resultar en sanciones adicionales.
              </p>
            </div>
          </div>
        `;
      }

      // Generar lista de compromisos de la otra parte
      if (otherCompliances.length > 0) {
        compliancesHTML += `
          <div style="margin-top: 30px;">
            <h3 style="color: #48a6a7; margin: 0 0 10px 0; font-size: 16px;">Compromisos de la otra parte (${otherCompliances.length})</h3>
            <p style="color: #666; font-size: 14px; margin: 10px 0 20px 0;">
              La otra parte involucrada en el reclamo debe cumplir con los siguientes compromisos:
            </p>
        `;

        otherCompliances.forEach((c, index) => {
          const deadline = c.deadline
            ? new Date(c.deadline).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'No especificado';
          const typeLabel =
            complianceTypeLabels[c.complianceType] || c.complianceType;

          compliancesHTML += `
            <div style="background-color: #f0f8f8; padding: 18px; border-left: 5px solid #48a6a7; margin: 12px 0; border-radius: 4px;">
              <div style="margin-bottom: 10px;">
                <span style="background-color: #48a6a7; color: white; padding: 4px 10px; border-radius: 3px; font-size: 12px; font-weight: bold;">COMPROMISO ${index + 1}</span>
              </div>
              <p style="margin: 10px 0 0 0; color: #333; font-weight: bold; font-size: 15px;">${typeLabel}</p>
              ${c.moderatorInstructions ? `<p style="margin: 10px 0; color: #555; font-size: 14px; line-height: 1.5;"><strong>Instrucciones:</strong><br>${c.moderatorInstructions}</p>` : ''}
              <p style="margin: 10px 0 0 0; color: #48a6a7; font-size: 13px;"><strong>Plazo límite:</strong> ${deadline}</p>
            </div>
          `;
        });

        compliancesHTML += '</div>';
      }

      compliancesHTML += '</div>';
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: ${statusColor}; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Reclamo ${statusLabel.toLowerCase()}</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            El reclamo relacionado con el servicio <strong>${claimData.hiringTitle}</strong> ha sido ${statusLabel.toLowerCase()} por un moderador de Conexia.
          </p>
          
          <!-- Tipo de resolución -->
          ${
            resolutionInfo
              ? `
          <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Tipo de resolución</h3>
            <p style="margin: 0; color: #48a6a7; font-weight: bold; font-size: 15px;">${resolutionInfo.label}</p>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">${resolutionInfo.description}</p>
          </div>
          `
              : ''
          }
          
          <!-- Resolución del moderador -->
          <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid ${statusColor}; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Decisión del moderador</h3>
            <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">${claimData.resolution}</p>
          </div>
          
          <!-- Compromisos -->
          ${compliancesHTML}
          
          <!-- Botón -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://conexia.com/claims/${claimData.claimId}" 
               style="display: inline-block; background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver detalles del reclamo
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas o necesitas asistencia, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateClaimCreatedAdminEmailHTML(claimData: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #ff6b6b; margin: 0;">🚨 Nuevo Reclamo - Acción Requerida</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Equipo de Moderación,</p>
          
          <p style="color: #666; font-size: 14px;">
            Se ha creado un nuevo reclamo que requiere revisión:
          </p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${claimData.hiringTitle}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>ID Reclamo:</strong> ${claimData.claimId}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Tipo:</strong> ${claimData.claimType}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Reclamante:</strong> ${claimData.claimantName} (${claimData.claimantRole})</p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <strong>Descripción:</strong><br>
            ${claimData.description}
          </p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24; font-size: 14px;">
              <strong>⚠️ Servicio Congelado:</strong> Todas las acciones están suspendidas hasta que se resuelva este reclamo.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/admin/claims/${claimData.claimId}" 
               style="display: inline-block; background-color: #ff4953; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Revisar Reclamo Ahora
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Panel de Administración - Conexia
            </p>
          </div>
        </div>
      </div>
    `;
  }

  // ===== Plain Text Templates =====

  private generateClaimCreatedEmailText(
    recipientName: string,
    roleLabel: string,
    claimData: any,
  ): string {
    return `
Hola ${recipientName},

El ${roleLabel} ha creado un reclamo para el servicio: ${claimData.hiringTitle}

Motivo: ${claimData.claimType}
Reclamante: ${claimData.claimantName}

IMPORTANTE: El servicio está congelado hasta que un moderador resuelva el reclamo.

Descripción del problema:
${claimData.description}

Ver detalles: https://conexia.com/claims/${claimData.claimId}

Recibirás una notificación cuando el reclamo sea resuelto.
    `;
  }

  private generateClaimConfirmationEmailText(
    recipientName: string,
    claimData: any,
  ): string {
    return `
Hola ${recipientName},

Tu reclamo ha sido creado y registrado exitosamente:

Servicio: ${claimData.hiringTitle}
ID Reclamo: ${claimData.claimId}
Motivo: ${claimData.claimType}

¿Qué sucede ahora?
- El servicio quedará pausado hasta que un moderador revise tu reclamo
- Un moderador analizará las evidencias presentadas
- Recibirás notificaciones sobre el progreso del reclamo
- Te informaremos cuando se tome una decisión

Tu descripción:
${claimData.description}

Ver estado: https://conexia.com/claims/${claimData.claimId}

Si el moderador necesita información adicional, recibirás un email solicitando aclaraciones.
    `;
  }

  private generateClaimResolvedEmailText(
    recipientName: string,
    recipientUserId: number,
    statusLabel: string,
    claimData: any,
    compliances: any[] = [],
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      // Compromisos monetarios
      full_refund: 'Reembolso Total',
      partial_refund: 'Reembolso Parcial',
      payment_required: 'Pago Requerido',
      partial_payment: 'Pago Parcial',
      // Compromisos de trabajo
      work_completion: 'Completar Trabajo',
      work_revision: 'Revisión de Trabajo',
      full_redelivery: 'Reentrega Completa',
      corrected_delivery: 'Entrega Corregida',
      additional_delivery: 'Entrega Adicional',
      // Documentación
      evidence_upload: 'Subir Evidencia',
      // Finalización
      confirmation_only: 'Solo Confirmación',
      other: 'Otro',
    };

    let compliancesText = '';
    if (compliances && compliances.length > 0) {
      // Separar compromisos propios de ajenos
      const myCompliances = compliances.filter(
        (c) => c.responsibleUserId === recipientUserId,
      );
      const otherCompliances = compliances.filter(
        (c) => c.responsibleUserId !== recipientUserId,
      );

      // Mis compromisos
      if (myCompliances.length > 0) {
        compliancesText += '\n\nTUS COMPROMISOS:\n';
        compliancesText += '='.repeat(50) + '\n\n';
        myCompliances.forEach((c, index) => {
          const deadline = c.deadline
            ? new Date(c.deadline).toLocaleDateString('es-ES')
            : 'No especificado';
          const typeLabel =
            complianceTypeLabels[c.complianceType] || c.complianceType;
          compliancesText += `Compromiso ${index + 1}: ${typeLabel}\n`;
          if (c.moderatorInstructions) {
            compliancesText += `Instrucciones: ${c.moderatorInstructions}\n`;
          }
          compliancesText += `Plazo: ${deadline}\n\n`;
        });
        compliancesText +=
          'IMPORTANTE: Debes cumplir con estos compromisos en los plazos indicados.\n';
      }

      // Compromisos de la otra parte
      if (otherCompliances.length > 0) {
        compliancesText += '\n\nCOMPROMISOS DE LA OTRA PARTE:\n';
        compliancesText += '='.repeat(50) + '\n\n';
        otherCompliances.forEach((c, index) => {
          const deadline = c.deadline
            ? new Date(c.deadline).toLocaleDateString('es-ES')
            : 'No especificado';
          const typeLabel =
            complianceTypeLabels[c.complianceType] || c.complianceType;
          compliancesText += `Compromiso ${index + 1}: ${typeLabel}\n`;
          if (c.moderatorInstructions) {
            compliancesText += `Instrucciones: ${c.moderatorInstructions}\n`;
          }
          compliancesText += `Plazo: ${deadline}\n\n`;
        });
      }
    }
    const resolutionTypeLabels: Record<string, string> = {
      client_favor:
        'A favor del cliente - El servicio ha sido cancelado y el cliente no realizará el pago.',
      provider_favor:
        'A favor del proveedor - El servicio se marca como finalizado y el proveedor recibirá el pago completo.',
      partial_agreement:
        'Acuerdo parcial - Ambas partes llegaron a un acuerdo.',
    };

    const resolutionTypeText =
      claimData.resolutionType && resolutionTypeLabels[claimData.resolutionType]
        ? `\n\nTipo de Resolución:\n${resolutionTypeLabels[claimData.resolutionType]}`
        : '';

    return `
Hola ${recipientName},

El reclamo para el servicio "${claimData.hiringTitle}" ha sido ${statusLabel.toLowerCase()} por un moderador.${resolutionTypeText}

Resolución:
${claimData.resolution}${compliancesText}

El servicio ha sido desbloqueado y puedes continuar con las acciones correspondientes.

Ver detalles: https://conexia.com/claims/${claimData.claimId}
    `;
  }

  private generateClaimCreatedAdminEmailText(claimData: any): string {
    return `
[ADMIN] Nuevo Reclamo - Acción Requerida

Se ha creado un nuevo reclamo que requiere revisión:

Servicio: ${claimData.hiringTitle}
ID Reclamo: ${claimData.claimId}
Tipo: ${claimData.claimType}
Reclamante: ${claimData.claimantName} (${claimData.claimantRole})

Descripción:
${claimData.description}

IMPORTANTE: El servicio está congelado hasta que se resuelva este reclamo.

Revisar reclamo: https://conexia.com/admin/claims/${claimData.claimId}
    `;
  }

  private generateServiceTerminatedEmailHTML(
    clientName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      providerName: string;
      reason: string;
    },
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff4953; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Actualización Importante</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${clientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Lamentamos informarte que el servicio que contrataste ha sido <strong>finalizado por nuestro equipo de moderación</strong>.
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #ff4953; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Detalles de la Contratación</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Servicio:</strong> ${serviceData.serviceTitle}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Proveedor:</strong> ${serviceData.providerName}</p>
          </div>
          
          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #bf373e; font-size: 14px;">
              <strong>Motivo de la finalización:</strong>
            </p>
            <p style="margin: 0; color: #bf373e; font-size: 14px;">
              ${serviceData.reason}
            </p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #2d6a6b; font-size: 14px;">
              <strong>Información sobre reembolso:</strong>
            </p>
            <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #2d6a6b; font-size: 14px;">
              <li style="margin-bottom: 8px;">Nuestro equipo procesará el reembolso si corresponde en las próximas 24-48 horas</li>
              <li style="margin-bottom: 8px;">Recibirás una notificación cuando el reembolso se complete</li>
              <li style="margin-bottom: 8px;"><strong>Si tienes dudas sobre el proceso de reembolso, contáctanos en soporte@conexia.com</strong></li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Lamentamos sinceramente las molestias que esto pueda haber causado. En Conexia trabajamos constantemente para mantener un entorno seguro y profesional.
          </p>

          <p style="color: #666; font-size: 14px;">
            Te invitamos a explorar otros proveedores similares en nuestra plataforma que puedan ayudarte con tus necesidades.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/servicios" style="background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Buscar Servicios Similares
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center;">
            Si tienes alguna pregunta o necesitas asistencia, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin-top: 10px;">
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      </div>
    `;
  }

  private generateServiceTerminatedEmailText(
    clientName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      providerName: string;
      reason: string;
    },
  ): string {
    return `
Actualización Importante sobre tu Contratación

Hola ${clientName},

Lamentamos informarte que el servicio que contrataste ha sido finalizado por nuestro equipo de moderación.

DETALLES DE LA CONTRATACIÓN:
- Servicio: ${serviceData.serviceTitle}
- Proveedor: ${serviceData.providerName}

MOTIVO DE LA FINALIZACIÓN:
${serviceData.reason}

INFORMACIÓN SOBRE REEMBOLSO:
✓ Nuestro equipo procesará el reembolso si corresponde en las próximas 24-48 horas
✓ Recibirás una notificación cuando el reembolso se complete
✓ Si tienes dudas sobre el proceso de reembolso, contáctanos en soporte@conexia.com

Lamentamos sinceramente las molestias que esto pueda haber causado. En Conexia trabajamos constantemente para mantener un entorno seguro y profesional.

Te invitamos a explorar otros proveedores similares en nuestra plataforma:
https://conexia.com/servicios

---
Para consultas sobre reembolsos o asistencia general, contáctanos en soporte@conexia.com

Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  private generateClaimFinishedByModerationEmailHTML(
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      reason: string;
      claimUrl: string;
    },
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff4953; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Actualización Importante</h1>
          </div>

          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>

          <p style="color: #666; font-size: 14px;">
            Te informamos que tu reclamo asociado al servicio <strong>${claimData.hiringTitle}</strong> ha sido <strong>finalizado por nuestro equipo de moderación</strong>.
          </p>

          <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #ff4953; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Detalles del Reclamo</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Servicio:</strong> ${claimData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666;"><strong>ID del reclamo:</strong> ${claimData.claimId}</p>
          </div>

          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #bf373e; font-size: 14px;">
              <strong>Motivo de la finalización:</strong>
            </p>
            <p style="margin: 0; color: #bf373e; font-size: 14px;">
              ${claimData.reason}
            </p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; color: #2d6a6b; font-size: 14px;">
              <strong>Información importante:</strong>
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #2d6a6b; font-size: 14px;">
              <li style="margin-bottom: 8px;">Los compromisos asociados a este reclamo también fueron <strong>finalizados por moderación</strong>.</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="${claimData.claimUrl}" style="background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Ver Reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">

          <p style="color: #9fa7a7; font-size: 12px; text-align: center;">
            Si tenés alguna pregunta o necesitás asistencia, contactanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>

          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin-top: 10px;">
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      </div>
    `;
  }

  private generateClaimFinishedByModerationEmailText(
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      reason: string;
      claimUrl: string;
    },
  ): string {
    return `
Actualización importante sobre tu reclamo

Hola ${recipientName},

Te informamos que tu reclamo asociado al servicio "${claimData.hiringTitle}" ha sido finalizado por nuestro equipo de moderación.

DETALLES DEL RECLAMO:
- Servicio: ${claimData.hiringTitle}
- ID del reclamo: ${claimData.claimId}

MOTIVO DE LA FINALIZACIÓN:
${claimData.reason}

INFORMACIÓN IMPORTANTE:
✓ Los compromisos asociados a este reclamo también fueron finalizados por moderación.
✓ Si tenés dudas o necesitás asistencia, contactanos en soporte@conexia.com

Ver reclamo:
${claimData.claimUrl}

---
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Envía un email al proveedor cuando el cliente es baneado
   */
  async sendServiceTerminatedClientBannedEmail(
    providerEmail: string,
    providerName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      clientName: string;
      reason: string;
    },
  ): Promise<void> {
    const html = this.generateServiceTerminatedClientBannedEmailHTML(
      providerName,
      serviceData,
    );
    const text = this.generateServiceTerminatedClientBannedEmailText(
      providerName,
      serviceData,
    );

    await this.sendEmail({
      to: providerEmail,
      subject: `Actualización importante sobre tu servicio: ${serviceData.serviceTitle} - Conexia`,
      html,
      text,
    });

    this.logger.log(
      `Email de servicio terminado (cliente baneado) enviado a proveedor: ${providerEmail}`,
    );
  }

  private generateServiceTerminatedClientBannedEmailHTML(
    providerName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      clientName: string;
      reason: string;
    },
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #48a6a7; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Actualización Importante</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${providerName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Te informamos que una contratación de tu servicio ha sido finalizada por nuestro equipo de moderación debido a que el cliente ha sido suspendido de la plataforma.
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #48a6a7; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalles de la Contratación</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Servicio:</strong> ${serviceData.serviceTitle}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Cliente:</strong> ${serviceData.clientName}</p>
          </div>

          <div style="background-color: #ffedee; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff4953;">
            <p style="margin: 0; color: #bf373e; font-size: 14px;">
              <strong>Motivo de la finalización:</strong><br>
              ${serviceData.reason}
            </p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #48a6a7;">
            <p style="margin: 0 0 10px 0; color: #2d6a6b; font-size: 14px;">
              <strong>💡 Información importante:</strong>
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #2d6a6b; font-size: 14px;">
              <li style="margin-bottom: 8px;">Esta finalización <strong>no afecta tu reputación</strong> en la plataforma</li>
              <li style="margin-bottom: 8px;">Tu servicio sigue disponible para otros clientes</li>
              <li style="margin-bottom: 8px;">No es necesario que tomes ninguna acción adicional</li>
              <li style="margin-bottom: 8px;"><strong>Si hay trabajo completado pendiente de pago, contáctanos en soporte@conexia.com para coordinar el proceso</strong></li>
            </ul>
          </div>

          <p style="color: #666; font-size: 14px;">
            Lamentamos los inconvenientes que esto pueda causar. Esta medida es parte de nuestro compromiso de mantener un entorno seguro y profesional en Conexia.
          </p>

          <p style="color: #666; font-size: 14px;">
            Puedes seguir recibiendo nuevas contrataciones de otros clientes sin ninguna restricción.
          </p>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/mis-servicios" style="background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Ver Mis Servicios
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center;">
            Si tienes alguna pregunta o necesitas asistencia, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin-top: 10px;">
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      </div>
    `;
  }

  private generateServiceTerminatedClientBannedEmailText(
    providerName: string,
    serviceData: {
      hiringId: number;
      serviceTitle: string;
      clientName: string;
      reason: string;
    },
  ): string {
    return `
Actualización Importante

Hola ${providerName},

Te informamos que una contratación de tu servicio ha sido finalizada por nuestro equipo de moderación debido a que el cliente ha sido suspendido de la plataforma.

DETALLES DE LA CONTRATACIÓN:
- Servicio: ${serviceData.serviceTitle}
- Cliente: ${serviceData.clientName}

MOTIVO DE LA FINALIZACIÓN:
${serviceData.reason}

INFORMACIÓN IMPORTANTE:
✓ Esta finalización NO afecta tu reputación en la plataforma
✓ Tu servicio sigue disponible para otros clientes
✓ No es necesario que tomes ninguna acción adicional
✓ Si hay trabajo completado pendiente de pago, contáctanos en soporte@conexia.com para coordinar el proceso

Lamentamos los inconvenientes que esto pueda causar. Esta medida es parte de nuestro compromiso de mantener un entorno seguro y profesional en Conexia.

Puedes seguir recibiendo nuevas contrataciones de otros clientes sin ninguna restricción.

Ver mis servicios:
https://conexia.com/mis-servicios

---
Para consultas sobre pagos pendientes o asistencia general, contáctanos en soporte@conexia.com

Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Envía un email cuando se asignan compliances al resolver un reclamo
   */
  async sendComplianceCreatedEmail(
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
  ): Promise<void> {
    const html = this.generateComplianceCreatedEmailHTML(
      recipientName,
      claimData,
      compliances,
    );
    const text = this.generateComplianceCreatedEmailText(
      recipientName,
      claimData,
      compliances,
    );

    await this.sendEmail({
      to: recipientEmail,
      subject: `Compromisos asignados - ${claimData.hiringTitle}`,
      html,
      text,
    });

    this.logger.log(
      `Email de compliances asignados enviado a: ${recipientEmail} (${compliances.length} compliance(s))`,
    );
  }

  private generateComplianceCreatedEmailHTML(
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      resolution: string;
    },
    compliances: Array<{
      id: string;
      complianceType: string;
      moderatorInstructions: string;
      deadline: Date;
      originalDeadlineDays: number;
    }>,
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso Total',
      partial_refund: 'Reembolso Parcial',
      payment_required: 'Pago Requerido',
      work_completion: 'Completar Trabajo',
      work_revision: 'Revisión de Trabajo',
      apology_required: 'Disculpa Requerida',
      service_discount: 'Descuento en Servicio',
      penalty_fee: 'Tarifa de Penalización',
      account_restriction: 'Restricción de Cuenta',
      confirmation_only: 'Solo Confirmación',
      other: 'Otro',
    };

    const compliancesHTML = compliances
      .map((c, index) => {
        const typeLabel =
          complianceTypeLabels[c.complianceType] || c.complianceType;
        const deadlineStr = new Date(c.deadline).toLocaleDateString('es-AR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        return `
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #48a6a7; border-radius: 5px; margin-bottom: 15px;">
          <h4 style="color: #333; margin-top: 0;">Compromiso ${index + 1}: ${typeLabel}</h4>
          <p style="margin: 5px 0; color: #666;"><strong>Plazo:</strong> ${c.originalDeadlineDays} día(s) - Vence el ${deadlineStr}</p>
          <p style="margin: 5px 0; color: #666;"><strong>ID:</strong> ${c.id}</p>
          <div style="background-color: white; padding: 10px; border-radius: 3px; margin-top: 10px;">
            <strong style="color: #333;">Instrucciones:</strong>
            <p style="color: #666; margin: 10px 0 0 0;">${c.moderatorInstructions}</p>
          </div>
        </div>
        `;
      })
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #48a6a7; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Compromisos Asignados</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Como parte de la resolución del reclamo sobre <strong>"${claimData.hiringTitle}"</strong>, 
            se te han asignado <strong>${compliances.length}</strong> compromiso(s) a cumplir.
          </p>

          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #333; margin: 0;"><strong>Resolución del Moderador:</strong></p>
            <p style="color: #666; margin: 10px 0 0 0; font-style: italic;">${claimData.resolution}</p>
          </div>

          <h3 style="color: #333; margin-top: 30px;">Tus Compromisos:</h3>
          ${compliancesHTML}

          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin-top: 20px;">
            <p style="margin: 0; color: #856404;"><strong>⚠️ Importante:</strong></p>
            <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
              <li>Debes cumplir con cada compromiso dentro del plazo establecido</li>
              <li>Sube la evidencia del cumplimiento en tu panel de Compliances</li>
              <li>Un moderador revisará y aprobará tu cumplimiento</li>
              <li>El incumplimiento puede resultar en consecuencias en tu cuenta</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/compliances" style="display: inline-block; padding: 12px 30px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver Mis Compromisos
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Para consultas, contáctanos en soporte@conexia.com<br>
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      </div>
    `;
  }

  private generateComplianceCreatedEmailText(
    recipientName: string,
    claimData: {
      claimId: string;
      hiringTitle: string;
      resolution: string;
    },
    compliances: Array<{
      id: string;
      complianceType: string;
      moderatorInstructions: string;
      deadline: Date;
      originalDeadlineDays: number;
    }>,
  ): string {
    const compliancesList = compliances
      .map((c, index) => {
        const deadlineStr = new Date(c.deadline).toLocaleDateString('es-AR');
        return `
${index + 1}. ${c.complianceType.toUpperCase()}
   Plazo: ${c.originalDeadlineDays} día(s) - Vence: ${deadlineStr}
   ID: ${c.id}
   Instrucciones: ${c.moderatorInstructions}
`;
      })
      .join('\n');

    return `
COMPROMISOS ASIGNADOS - CONEXIA

Hola ${recipientName},

Como parte de la resolución del reclamo sobre "${claimData.hiringTitle}", 
se te han asignado ${compliances.length} compromiso(s) a cumplir.

RESOLUCIÓN DEL MODERADOR:
${claimData.resolution}

TUS COMPROMISOS:
${compliancesList}

⚠️ IMPORTANTE:
- Debes cumplir con cada compromiso dentro del plazo establecido
- Sube la evidencia del cumplimiento en tu panel de Compliances
- Un moderador revisará y aprobará tu cumplimiento
- El incumplimiento puede resultar en consecuencias en tu cuenta

Ver mis compromisos: https://conexia.com/compliances

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Envía un email cuando el usuario envía evidencia de cumplimiento
   */
  async sendComplianceSubmittedEmail(
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
  ): Promise<void> {
    const html = this.generateComplianceSubmittedEmailHTML(
      responsibleUserName,
      complianceData,
    );
    const text = this.generateComplianceSubmittedEmailText(
      responsibleUserName,
      complianceData,
    );

    await this.sendEmail({
      to: moderatorEmail,
      subject: `Compromiso enviado para revisión - ${complianceData.hiringTitle}`,
      html,
      text,
    });

    this.logger.log(
      `Email de compliance enviado a moderador: ${moderatorEmail}`,
    );
  }

  private generateComplianceSubmittedEmailHTML(
    responsibleUserName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      userNotes?: string | null;
      evidenceUrls?: string[] | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'reembolso total',
      partial_refund: 'reembolso parcial',
      partial_payment: 'pago parcial',
      payment_required: 'pago requerido',
      work_completion: 'completar trabajo',
      work_revision: 'revisión de trabajo',
      apology_required: 'disculpa requerida',
      service_discount: 'descuento en servicio',
      penalty_fee: 'tarifa de penalización',
      account_restriction: 'restricción de cuenta',
      confirmation_only: 'solo confirmación',
      additional_delivery: 'entrega adicional',
      corrected_delivery: 'entrega corregida',
      evidence_upload: 'subir evidencia',
      other: 'otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const notesSection = complianceData.userNotes
      ? `
      <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Notas del usuario</h3>
        <p style="color: #666; margin: 0; font-size: 14px;">${complianceData.userNotes}</p>
      </div>
    `
      : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #28a745; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Nuevo compromiso para revisar</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>Moderador</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            <strong>${responsibleUserName}</strong> ha enviado evidencia de cumplimiento para un compromiso que requiere tu revisión.
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #28a745; font-weight: bold; font-size: 14px;">Estado: Pendiente de revisión</p>
          </div>

          ${notesSection}

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/admin/claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Revisar Reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
        </div>
      </div>
    `;
  }

  private generateComplianceSubmittedEmailText(
    responsibleUserName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      userNotes?: string | null;
      evidenceUrls?: string[] | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'reembolso total',
      partial_refund: 'reembolso parcial',
      partial_payment: 'pago parcial',
      payment_required: 'pago requerido',
      work_completion: 'completar trabajo',
      work_revision: 'revisión de trabajo',
      apology_required: 'disculpa requerida',
      service_discount: 'descuento en servicio',
      penalty_fee: 'tarifa de penalización',
      account_restriction: 'restricción de cuenta',
      confirmation_only: 'solo confirmación',
      additional_delivery: 'entrega adicional',
      corrected_delivery: 'entrega corregida',
      evidence_upload: 'subir evidencia',
      other: 'otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const notes = complianceData.userNotes
      ? `\nNOTAS DEL USUARIO:\n${complianceData.userNotes}`
      : '';

    return `
COMPROMISO ENVIADO - CONEXIA

Hola Moderador,

${responsibleUserName} ha enviado evidencia de cumplimiento para su compromiso.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
ID del compromiso: ${complianceData.complianceId}
${notes}

Revisar reclamo: https://conexia.com/admin/claims?claimId=${complianceData.claimId}

---
Para consultas, contáctanos en soporte@conexia.com
    `;
  }

  /**
   * Envía un email al moderador cuando se realiza una peer review (pre-aprobación o objeción)
   */
  async sendPeerReviewToModeratorEmail(
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
  ): Promise<void> {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'reembolso total',
      partial_refund: 'reembolso parcial',
      partial_payment: 'pago parcial',
      payment_required: 'pago requerido',
      work_completion: 'completar trabajo',
      work_revision: 'revisión de trabajo',
      apology_required: 'disculpa requerida',
      service_discount: 'descuento en servicio',
      penalty_fee: 'tarifa de penalización',
      account_restriction: 'restricción de cuenta',
      confirmation_only: 'solo confirmación',
      additional_delivery: 'entrega adicional',
      corrected_delivery: 'entrega corregida',
      evidence_upload: 'subir evidencia',
      other: 'otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const statusBadge =
      peerReviewStatus === 'aprobado'
        ? `<div style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px;">
           <span style="color: #155724; font-weight: bold; font-size: 14px;">✓ Pre-aprobado</span>
         </div>`
        : `<div style="background-color: #ffedee; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px;">
           <span style="color: #bf373e; font-weight: bold; font-size: 14px;">Objetado</span>
         </div>`;

    const reasonSection = complianceData.peerReviewReason
      ? `
      <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Comentarios de ${peerReviewerName}</h3>
        <p style="color: #666; margin: 0; font-size: 14px;">${complianceData.peerReviewReason}</p>
      </div>
    `
      : '';

    const headerColor = peerReviewStatus === 'aprobado' ? '#28a745' : '#ff9800';
    const headerTitle =
      peerReviewStatus === 'aprobado'
        ? 'Compromiso pre-aprobado'
        : 'Compromiso objetado';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: ${headerColor}; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${headerTitle}</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>Moderador</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            <strong>${responsibleUserName}</strong> envió evidencia de cumplimiento y <strong>${peerReviewerName}</strong> la ha ${peerReviewStatus}.
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Responsable:</strong> ${responsibleUserName}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Revisado por:</strong> ${peerReviewerName}</p>
            ${statusBadge}
          </div>

          ${reasonSection}

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/admin/claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: ${headerColor}; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Revisar Reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
        </div>
      </div>
    `;

    await this.sendEmail({
      to: moderatorEmail,
      subject: `Compromiso ${peerReviewStatus} - ${complianceData.hiringTitle}`,
      html,
    });

    this.logger.log(
      `Email de peer review (${peerReviewStatus}) enviado a moderador: ${moderatorEmail}`,
    );
  }

  /**
   * Envía un email cuando el moderador aprueba un compliance
   */
  async sendComplianceApprovedEmail(
    recipientEmail: string,
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      moderatorNotes?: string | null;
    },
  ): Promise<void> {
    const html = this.generateComplianceApprovedEmailHTML(
      recipientName,
      complianceData,
    );
    const text = this.generateComplianceApprovedEmailText(
      recipientName,
      complianceData,
    );

    await this.sendEmail({
      to: recipientEmail,
      subject: `Compromiso aprobado - ${complianceData.hiringTitle}`,
      html,
      text,
    });

    this.logger.log(
      `Email de compliance aprobado enviado a: ${recipientEmail}`,
    );
  }

  private generateComplianceApprovedEmailHTML(
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      moderatorNotes?: string | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      additional_delivery: 'Entrega adicional',
      full_redelivery: 'Reentrega completa',
      corrected_delivery: 'Entrega corregida',
      evidence_upload: 'Subir evidencia',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const notesSection = complianceData.moderatorNotes
      ? `
      <div style="background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Comentarios del moderador</h3>
        <p style="color: #155724; margin: 0; font-size: 14px;">${complianceData.moderatorNotes}</p>
      </div>
    `
      : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #28a745; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Compromiso Aprobado</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Felicitaciones. El moderador ha aprobado tu cumplimiento del compromiso. Has completado exitosamente esta obligación.
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Compromiso:</strong> #${complianceData.complianceId}</p>
            <div style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px;">
              <span style="color: #155724; font-weight: bold; font-size: 14px;">✓ Aprobado</span>
            </div>
          </div>

          ${notesSection}

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver mi reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateComplianceApprovedEmailText(
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      moderatorNotes?: string | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso Total',
      partial_refund: 'Reembolso Parcial',
      payment_required: 'Pago Requerido',
      work_completion: 'Completar Trabajo',
      work_revision: 'Revisión de Trabajo',
      apology_required: 'Disculpa Requerida',
      service_discount: 'Descuento en Servicio',
      penalty_fee: 'Tarifa de Penalización',
      account_restriction: 'Restricción de Cuenta',
      confirmation_only: 'Solo Confirmación',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const notes = complianceData.moderatorNotes
      ? `\n💬 COMENTARIOS DEL MODERADOR:\n${complianceData.moderatorNotes}`
      : '';

    return `
✅ ¡COMPROMISO APROBADO! - CONEXIA

Hola ${recipientName},

¡Felicidades! El moderador ha aprobado tu cumplimiento del compromiso.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Estado: APROBADO
${notes}

Ver detalles: https://conexia.com/compliances/${complianceData.complianceId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Envía un email cuando el moderador rechaza un compliance
   */
  async sendComplianceRejectedEmail(
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
  ): Promise<void> {
    const html = this.generateComplianceRejectedEmailHTML(
      recipientName,
      complianceData,
    );
    const text = this.generateComplianceRejectedEmailText(
      recipientName,
      complianceData,
    );

    await this.sendEmail({
      to: recipientEmail,
      subject: `Compromiso rechazado - ${complianceData.hiringTitle}`,
      html,
      text,
    });

    this.logger.log(
      `Email de compliance rechazado enviado a: ${recipientEmail}`,
    );
  }

  private generateComplianceRejectedEmailHTML(
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
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'reembolso total',
      partial_refund: 'reembolso parcial',
      partial_payment: 'pago parcial',
      payment_required: 'pago requerido',
      work_completion: 'completar trabajo',
      work_revision: 'revisión de trabajo',
      apology_required: 'disculpa requerida',
      service_discount: 'descuento en servicio',
      penalty_fee: 'tarifa de penalización',
      account_restriction: 'restricción de cuenta',
      confirmation_only: 'solo confirmación',
      additional_delivery: 'entrega adicional',
      full_redelivery: 'reentrega completa',
      corrected_delivery: 'entrega corregida',
      evidence_upload: 'subir evidencia',
      other: 'otro',
    };

    const typeLabel =
      complianceData.complianceLabel ||
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    // Determinar el mensaje de advertencia según el número de rechazos
    let warningMessage = '';
    let warningColor = '#ff9800';

    if (complianceData.rejectionCount === 1) {
      warningMessage = 'Primera advertencia';
      warningColor = '#ff9800';
    } else if (complianceData.rejectionCount === 2) {
      warningMessage = 'Segunda advertencia - Suspensión de 15 días';
      warningColor = '#ff4953';
    } else if (complianceData.rejectionCount >= 3) {
      warningMessage = 'Tercer rechazo - Cuenta baneada permanentemente';
      warningColor = '#bf373e';
    }

    // Para segundo rechazo, construir secciones especiales
    let reasonSection = '';
    let warningSection = '';

    if (complianceData.isSecondRejection && !complianceData.isOtherPartyEmail) {
      // Email para usuario responsable en segundo rechazo
      reasonSection = complianceData.moderatorNotes
        ? `
      <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Motivo del rechazo del moderador</h3>
        <p style="color: #bf373e; margin: 0; font-size: 14px;">${complianceData.moderatorNotes}</p>
      </div>
    `
        : '';

      warningSection = `
      <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #bf373e; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #bf373e;">CONSECUENCIA: Suspensión de 15 días</h3>
        <p style="color: #333; font-size: 14px; margin: 10px 0;">
          Tu cuenta ha sido <strong>suspendida por 15 días</strong> por no cumplir con el compromiso de <strong>${typeLabel}</strong>.
        </p>
        <p style="color: #333; font-size: 14px; margin: 10px 0;">
          Durante la suspensión:
        </p>
        <ul style="color: #666; font-size: 14px; margin: 5px 0; padding-left: 20px;">
          <li>No podrás publicar nuevos servicios ni proyectos</li>
          <li>Debes completar tus compromisos activos</li>
          <li>Recibirás un email adicional con los detalles de tu suspensión</li>
        </ul>
      </div>

      <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #856404;">Advertencia importante</h3>
        <p style="color: #856404; font-size: 14px; margin: 0;">
          Si vuelves a ser rechazado en el futuro, <strong>serás BANEADO PERMANENTEMENTE</strong> de la plataforma.
        </p>
      </div>
    `;
    } else if (complianceData.isOtherPartyEmail) {
      // Email para la otra parte (cualquier rechazo) - NO mostrar motivo
      reasonSection = '';

      if (complianceData.rejectionCount >= 3) {
        // Tercer rechazo - Ban permanente
        warningSection = `
      <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #bf373e; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #bf373e;">Consecuencia aplicada</h3>
        <p style="color: #bf373e; font-size: 14px; margin: 0;">
          La persona responsable del compromiso de <strong>${typeLabel}</strong> ha sido <strong>baneada permanentemente</strong> por no cumplir reiteradamente con los requisitos establecidos.
        </p>
        <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
          Este caso ha sido cerrado. Si tienes consultas, contacta a soporte.
        </p>
      </div>
    `;
      } else if (complianceData.rejectionCount === 2) {
        // Segundo rechazo - Suspensión
        warningSection = `
      <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Consecuencia aplicada</h3>
        <p style="color: #2d6a6b; font-size: 14px; margin: 0;">
          La persona responsable del compromiso de <strong>${typeLabel}</strong> ha sido <strong>suspendida por 15 días</strong> por no cumplir con los requisitos establecidos.
        </p>
        <p style="color: #2d6a6b; font-size: 14px; margin: 10px 0 0 0;">
          Un moderador seguirá revisando este caso. Serás notificado sobre los próximos pasos.
        </p>
      </div>
    `;
      } else {
        // Primer rechazo
        warningSection = `
      <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #856404;">Primera advertencia</h3>
        <p style="color: #856404; font-size: 14px; margin: 0;">
          La evidencia del compromiso de <strong>${typeLabel}</strong> fue rechazada. La otra parte tiene oportunidad de corregirla.
        </p>
        <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
          Serás notificado cuando se envíe nueva evidencia.
        </p>
      </div>
    `;
      }
    } else {
      // Usuario responsable (primer o tercer rechazo)
      reasonSection = complianceData.moderatorNotes
        ? `
      <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Motivo del rechazo del moderador</h3>
        <p style="color: #bf373e; margin: 0; font-size: 14px; white-space: pre-line;">${complianceData.moderatorNotes}</p>
      </div>
    `
        : '';

      if (complianceData.rejectionCount >= 3) {
        // Tercer rechazo - Ban permanente
        warningSection = `
      <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #bf373e; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #bf373e;">CONSECUENCIA: Ban permanente</h3>
        <p style="color: #bf373e; font-size: 14px; margin: 10px 0; font-weight: bold;">
          Tu cuenta ha sido <strong>BANEADA PERMANENTEMENTE</strong> por no cumplir con el compromiso de <strong>${typeLabel}</strong> después de 3 rechazos.
        </p>
        <p style="color: #333; font-size: 14px; margin: 10px 0;">
          Ya no podrás:
        </p>
        <ul style="color: #666; font-size: 14px; margin: 5px 0; padding-left: 20px;">
          <li>Acceder a tu cuenta</li>
          <li>Publicar servicios o proyectos</li>
          <li>Participar en la plataforma</li>
        </ul>
        <p style="color: #666; font-size: 14px; margin: 10px 0 0 0;">
          Recibirás un email adicional con los detalles del baneo.
        </p>
      </div>
    `;
      } else {
        // Primer rechazo
        warningSection = `
      <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid ${warningColor}; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${warningMessage}</h3>
        <p style="color: #856404; margin: 0; font-size: 14px;">Tienes <strong>${complianceData.attemptsLeft || 2} ${(complianceData.attemptsLeft || 2) === 1 ? 'oportunidad' : 'oportunidades'} más</strong> para corregir esto antes de enfrentar consecuencias más graves.</p>
        ${complianceData.newDeadline ? `<p style="color: #856404; margin: 10px 0 0 0; font-size: 14px;"><strong>Nuevo plazo:</strong> ${complianceData.newDeadline}</p>` : ''}
        <p style="color: #d32f2f; margin: 10px 0 0 0; font-size: 14px; font-weight: bold;">⚠️ Si vuelves a ser rechazado serás SUSPENDIDO por 15 días.</p>
      </div>
    `;
      }
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff4953; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Compromiso rechazado</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            ${complianceData.isOtherPartyEmail ? 'El moderador ha rechazado la evidencia del compromiso enviada por la otra parte.' : 'El moderador ha rechazado la evidencia del compromiso. Por favor revisa el motivo y envía nueva evidencia que cumpla con los requisitos.'}
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #ff4953; font-weight: bold; font-size: 14px;">Estado: Rechazado</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Número de intentos:</strong> ${complianceData.rejectionCount}</p>
          </div>

          ${reasonSection}
          ${warningSection}

          ${
            complianceData.rejectionCount < 3 &&
            !complianceData.isOtherPartyEmail
              ? `
          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Próximos pasos</h3>
            <p style="color: #2d6a6b; font-size: 14px; margin: 0;">
              Por favor, sube nueva evidencia que cumpla con los requisitos especificados en las instrucciones del compromiso.
              Asegúrate de revisar cuidadosamente qué se solicitó antes de enviar nuevamente.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Subir nueva evidencia
            </a>
          </div>
          `
              : ''
          }

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateComplianceRejectedEmailText(
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      rejectionReason?: string | null;
      rejectionCount: number;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso Total',
      partial_refund: 'Reembolso Parcial',
      payment_required: 'Pago Requerido',
      work_completion: 'Completar Trabajo',
      work_revision: 'Revisión de Trabajo',
      apology_required: 'Disculpa Requerida',
      service_discount: 'Descuento en Servicio',
      penalty_fee: 'Tarifa de Penalización',
      account_restriction: 'Restricción de Cuenta',
      confirmation_only: 'Solo Confirmación',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const reason = complianceData.rejectionReason
      ? `\n📝 MOTIVO DEL RECHAZO:\n${complianceData.rejectionReason}`
      : '';

    const warning =
      complianceData.rejectionCount > 1
        ? `\n⚠️ ADVERTENCIA:\nEste es tu rechazo número ${complianceData.rejectionCount}. 
Los rechazos repetidos pueden resultar en consecuencias en tu cuenta.`
        : '';

    return `
⚠️ COMPROMISO RECHAZADO - CONEXIA

Hola ${recipientName},

Lamentablemente, el moderador ha rechazado tu cumplimiento del compromiso.
Por favor, revisa el motivo y vuelve a enviar la evidencia correcta.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Estado: RECHAZADO
Intentos: ${complianceData.rejectionCount}
${reason}
${warning}

Reenviar evidencia: https://conexia.com/compliances/${complianceData.complianceId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Envía un email a ambas partes cuando se sube evidencia de cumplimiento
   */
  async sendComplianceEvidenceUploadedEmail(
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
  ): Promise<void> {
    const html = this.generateComplianceEvidenceUploadedEmailHTML(
      recipientName,
      uploaderName,
      isResponsibleUser,
      complianceData,
    );
    const text = this.generateComplianceEvidenceUploadedEmailText(
      recipientName,
      uploaderName,
      isResponsibleUser,
      complianceData,
    );

    const subject = isResponsibleUser
      ? `Evidencia de compromiso enviada - ${complianceData.hiringTitle}`
      : `Nueva evidencia de compromiso disponible - ${complianceData.hiringTitle}`;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
    });

    this.logger.log(
      `Email de evidencia subida enviado a: ${recipientEmail} (${isResponsibleUser ? 'responsable' : 'otra parte'})`,
    );
  }

  private generateComplianceEvidenceUploadedEmailHTML(
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
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      additional_delivery: 'Entrega adicional',
      corrected_delivery: 'Entrega corregida',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const notesSection = complianceData.userNotes
      ? `
      <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Notas del usuario</h3>
        <p style="color: #666; margin: 0; font-size: 14px;">${complianceData.userNotes}</p>
      </div>
    `
      : '';

    if (isResponsibleUser) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px; background-color: #28a745; border-radius: 5px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Evidencia Enviada Correctamente</h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
            
            <p style="color: #666; font-size: 14px;">
              Tu evidencia de cumplimiento del compromiso ha sido enviada exitosamente y está en proceso de revisión.
            </p>
            
            <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Reclamo:</strong> #${complianceData.claimId}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Compromiso:</strong> #${complianceData.complianceId}</p>
              ${complianceData.attemptNumber > 1 ? `<p style="margin: 5px 0; color: #ff9800; font-size: 14px;"><strong>Intento:</strong> ${complianceData.attemptNumber}</p>` : ''}
              <p style="margin: 5px 0; color: #28a745; font-weight: bold; font-size: 14px;">Estado: En revisión</p>
            </div>

            ${notesSection}

            <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Próximos pasos</h3>
              <ul style="margin: 5px 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
                <li>La otra parte revisará la evidencia primero</li>
                <li>Un moderador de Conexia verificará el cumplimiento</li>
                <li>Recibirás una notificación con la decisión final</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Ver mi reclamo
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
            
            <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
              Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
              El equipo de Conexia
            </p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px; background-color: #48a6a7; border-radius: 5px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Nueva evidencia disponible para revisión</h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
            
            <p style="color: #666; font-size: 14px;">
              <strong>${uploaderName}</strong> ha enviado evidencia de cumplimiento para un compromiso del reclamo.
            </p>
            
            <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Reclamo:</strong> #${complianceData.claimId}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Compromiso:</strong> #${complianceData.complianceId}</p>
              <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Enviado por:</strong> ${uploaderName}</p>
              ${complianceData.attemptNumber > 1 ? `<p style="margin: 5px 0; color: #ff9800; font-size: 14px;"><strong>Intento:</strong> ${complianceData.attemptNumber}</p>` : ''}
              <p style="margin: 5px 0; color: #ff9800; font-weight: bold; font-size: 14px;">Estado: Pendiente de tu revisión</p>
            </div>

            ${notesSection}

            <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0; border: 1px solid #ffc107;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Tu acción es requerida</h3>
              <p style="color: #856404; font-size: 14px; margin: 0;">
                Por favor, revisa la evidencia enviada y confirma si cumple con lo acordado en la resolución del reclamo. 
                Tu revisión es necesaria antes de que un moderador evalúe el compromiso.
              </p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Ver mi reclamo
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
            
            <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
              Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
              El equipo de Conexia
            </p>
          </div>
        </div>
      `;
    }
  }

  private generateComplianceEvidenceUploadedEmailText(
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
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const notes = complianceData.userNotes
      ? `\nNOTAS DEL USUARIO:\n${complianceData.userNotes}`
      : '';

    const attempt =
      complianceData.attemptNumber > 1
        ? `Intento: ${complianceData.attemptNumber}`
        : '';

    if (isResponsibleUser) {
      return `
EVIDENCIA DE COMPROMISO ENVIADA - CONEXIA

Hola ${recipientName},

Tu evidencia de cumplimiento del compromiso ha sido enviada exitosamente y está siendo revisada.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
${attempt}
Estado: EN REVISIÓN
${notes}

PRÓXIMOS PASOS:
- La otra parte revisará la evidencia primero
- Luego un moderador verificará el cumplimiento
- Recibirás una notificación con la decisión final

Ver estado: https://conexia.com/compliances/${complianceData.complianceId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
      `;
    } else {
      return `
NUEVA EVIDENCIA DE COMPROMISO DISPONIBLE - CONEXIA

Hola ${recipientName},

${uploaderName} ha enviado evidencia de cumplimiento para un compromiso del servicio.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
${attempt}
Estado: PENDIENTE DE TU REVISIÓN
${notes}

TU ACCIÓN ES REQUERIDA:
Por favor, revisa la evidencia enviada y confirma si cumple con lo acordado.
Tu revisión es necesaria antes de que un moderador evalúe el compromiso.

Revisar evidencia: https://conexia.com/compliances/${complianceData.complianceId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
      `;
    }
  }

  /**
   * Envía un email cuando la otra parte aprueba el compliance (peer review)
   */
  async sendCompliancePeerApprovedEmail(
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
  ): Promise<void> {
    const html = this.generateCompliancePeerApprovedEmailHTML(
      recipientName,
      peerReviewerName,
      complianceData,
    );
    const text = this.generateCompliancePeerApprovedEmailText(
      recipientName,
      peerReviewerName,
      complianceData,
    );

    await this.sendEmail({
      to: recipientEmail,
      subject: `Revisión aprobada - ${complianceData.hiringTitle}`,
      html,
      text,
    });

    this.logger.log(
      `Email de peer review aprobado enviado a: ${recipientEmail}`,
    );
  }

  private generateCompliancePeerApprovedEmailHTML(
    recipientName: string,
    peerReviewerName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      peerReviewReason?: string | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const reasonSection = complianceData.peerReviewReason
      ? `
          <div style="background-color: #d4edda; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Comentarios de ${peerReviewerName}</h3>
            <p style="color: #155724; margin: 0; font-size: 14px;">${complianceData.peerReviewReason}</p>
          </div>
        `
      : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #28a745; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Evidencia Pre-aprobada por la otra parte</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            ${peerReviewerName} ha revisado la evidencia de cumplimiento que enviaste y la ha pre-aprobado.
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID Compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Pre-aprobado por:</strong> ${peerReviewerName}</p>
            <div style="background-color: #d4edda; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px;">
              <span style="color: #155724; font-weight: bold; font-size: 14px;">✓ PRE-APROBADO</span>
            </div>
          </div>

          ${reasonSection}

          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Próximo paso</h3>
            <p style="color: #856404; font-size: 14px; margin: 0;">
              Un moderador de Conexia realizará la revisión final del compromiso para verificar que cumple con los términos acordados en la resolución del reclamo. Recibirás una notificación cuando se complete la verificación y se tome la decisión final.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver mi reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateCompliancePeerApprovedEmailText(
    recipientName: string,
    peerReviewerName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      peerReviewReason?: string | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const reason = complianceData.peerReviewReason
      ? `\nCOMENTARIOS:\n${complianceData.peerReviewReason}`
      : '';

    return `
REVISIÓN APROBADA - CONEXIA

Hola ${recipientName},

${peerReviewerName} ha revisado y aprobado la evidencia de cumplimiento que enviaste.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Estado: APROBADO POR LA OTRA PARTE
${reason}

PRÓXIMO PASO:
Un moderador de Conexia realizará la revisión final del compromiso.
Recibirás una notificación cuando se complete la verificación.

Ver estado: https://conexia.com/compliances/${complianceData.complianceId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Envía un email cuando la otra parte rechaza el compliance (peer review)
   */
  async sendCompliancePeerRejectedEmail(
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
  ): Promise<void> {
    const html = this.generateCompliancePeerRejectedEmailHTML(
      recipientName,
      peerReviewerName,
      complianceData,
    );
    const text = this.generateCompliancePeerRejectedEmailText(
      recipientName,
      peerReviewerName,
      complianceData,
    );

    await this.sendEmail({
      to: recipientEmail,
      subject: `Revisión objetada - ${complianceData.hiringTitle}`,
      html,
      text,
    });

    this.logger.log(
      `Email de peer review rechazado enviado a: ${recipientEmail}`,
    );
  }

  private generateCompliancePeerRejectedEmailHTML(
    recipientName: string,
    peerReviewerName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      peerReviewReason?: string | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      partial_payment: 'Pago parcial',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      full_redelivery: 'Reentrega completa',
      corrected_delivery: 'Entrega corregida',
      additional_delivery: 'Entrega adicional',
      evidence_upload: 'Subir evidencia',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const reasonSection = complianceData.peerReviewReason
      ? `
          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Motivo de la objeción</h3>
            <p style="color: #bf373e; margin: 0; font-size: 14px;">${complianceData.peerReviewReason}</p>
          </div>
        `
      : '';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff9800; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Evidencia Objetada por la Otra Parte</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            ${peerReviewerName} ha revisado la evidencia de cumplimiento que enviaste y ha presentado una objeción.
          </p>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Objetado por:</strong> ${peerReviewerName}</p>
            <div style="background-color: #ffedee; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px;">
              <span style="color: #bf373e; font-weight: bold; font-size: 14px;">OBJETADO</span>
            </div>
          </div>

          ${reasonSection}

          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Próximo paso</h3>
            <p style="color: #856404; font-size: 14px; margin: 0;">
              Un moderador de Conexia revisará la evidencia que enviaste junto con la objeción presentada por ${peerReviewerName}. El moderador tomará una decisión final basándose en los términos acordados en la resolución del reclamo. Recibirás una notificación con el resultado de la moderación.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver mi reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateCompliancePeerRejectedEmailText(
    recipientName: string,
    peerReviewerName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      peerReviewReason?: string | null;
    },
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'Reembolso total',
      partial_refund: 'Reembolso parcial',
      payment_required: 'Pago requerido',
      work_completion: 'Completar trabajo',
      work_revision: 'Revisión de trabajo',
      apology_required: 'Disculpa requerida',
      service_discount: 'Descuento en servicio',
      penalty_fee: 'Tarifa de penalización',
      account_restriction: 'Restricción de cuenta',
      confirmation_only: 'Solo confirmación',
      other: 'Otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const reason = complianceData.peerReviewReason
      ? `\nMOTIVO DE LA OBJECIÓN:\n${complianceData.peerReviewReason}`
      : '';

    return `
REVISIÓN OBJETADA - CONEXIA

Hola ${recipientName},

${peerReviewerName} ha revisado la evidencia de cumplimiento que enviaste y ha presentado una objeción.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Estado: OBJETADO POR LA OTRA PARTE
${reason}

PRÓXIMO PASO:
Un moderador de Conexia revisará la evidencia y la objeción presentada para tomar una decisión final.
Recibirás una notificación con el resultado de la moderación.

Ver detalles: https://conexia.com/compliances/${complianceData.complianceId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  // ============ EMAILS DE ADVERTENCIAS DE DEADLINE ============

  /**
   * Email de advertencia cuando faltan menos de 24 horas para el deadline
   */
  async sendComplianceDeadlineWarningEmail(
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
  ): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: 'Recordatorio: Tu plazo de cumplimiento está por vencer',
      html: this.generateDeadlineWarningHTML(recipientName, complianceData),
      text: this.generateDeadlineWarningText(recipientName, complianceData),
    });
  }

  private generateDeadlineWarningHTML(
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
  ): string {
    const complianceTypeLabels: Record<string, string> = {
      full_refund: 'reembolso total',
      partial_refund: 'reembolso parcial',
      partial_payment: 'pago parcial',
      payment_required: 'pago requerido',
      work_completion: 'completar trabajo',
      work_revision: 'revisión de trabajo',
      apology_required: 'disculpa requerida',
      service_discount: 'descuento en servicio',
      penalty_fee: 'tarifa de penalización',
      account_restriction: 'restricción de cuenta',
      confirmation_only: 'solo confirmación',
      additional_delivery: 'entrega adicional',
      corrected_delivery: 'entrega corregida',
      evidence_upload: 'subir evidencia',
      other: 'otro',
    };

    const typeLabel =
      complianceTypeLabels[complianceData.complianceType] ||
      complianceData.complianceType;

    const deadlineStr = complianceData.deadline.toLocaleString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff9800; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Recordatorio de plazo</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Te recordamos que tienes un compromiso pendiente que debe ser cumplido antes del plazo establecido.
          </p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Tu plazo está por vencer</h3>
            <p style="color: #856404; margin: 0; font-size: 16px; font-weight: bold;">Te quedan ${complianceData.hoursRemaining} horas para cumplir con este compromiso</p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #ff9800; font-weight: bold; font-size: 14px;">Plazo límite: ${deadlineStr}</p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Instrucciones del moderador</h3>
            <p style="color: #2d6a6b; font-size: 14px; margin: 0; white-space: pre-line;">${complianceData.moderatorInstructions}</p>
          </div>

          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #bf373e;">Importante</h3>
            <p style="color: #bf373e; font-size: 14px; margin: 0;">
              Si no cumples antes del plazo, se aplicarán consecuencias progresivas que pueden incluir:
            </p>
            <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>Extensión del plazo con advertencia</li>
              <li>Suspensión temporal de tu cuenta</li>
              <li>Baneo permanente en caso de reincidencia</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Subir evidencia ahora
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a><br>
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateDeadlineWarningText(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );
    const deadlineStr = complianceData.deadline.toLocaleString('es-AR', {
      dateStyle: 'full',
      timeStyle: 'short',
    });

    return `
RECORDATORIO DE PLAZO - CONEXIA

Hola ${recipientName},

¡Tu plazo de cumplimiento está por vencer en ${complianceData.hoursRemaining} horas!

Te recordamos que tienes un compromiso pendiente que debe ser cumplido antes del ${deadlineStr}.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Plazo límite: ${deadlineStr}

INSTRUCCIONES DEL MODERADOR:
${complianceData.moderatorInstructions}

¿QUÉ HACER?
- Sube la evidencia de cumplimiento antes del plazo
- Asegúrate de seguir las instrucciones del moderador
- Si tienes dudas, contacta a nuestro equipo

IMPORTANTE: Si no cumples antes del plazo, se aplicarán consecuencias progresivas que pueden incluir extensiones de plazo, advertencias y eventualmente suspensión de cuenta.

Ver mi reclamo: https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Email cuando el deadline ha pasado (período de gracia con extensión)
   */
  async sendComplianceOverdueEmail(
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
  ): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: 'Advertencia: Plazo de cumplimiento vencido',
      html: this.generateOverdueHTML(recipientName, complianceData),
      text: this.generateOverdueText(recipientName, complianceData),
    });
  }

  private generateOverdueHTML(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );
    const originalDeadlineStr = complianceData.originalDeadline.toLocaleString(
      'es',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
    );
    const extendedDeadlineStr = complianceData.extendedDeadline.toLocaleString(
      'es',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
    );

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff9800; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Plazo vencido</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Tu plazo de cumplimiento ha vencido. Hemos extendido tu plazo para darte una oportunidad adicional.
          </p>
          
          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Extensión de plazo otorgada</h3>
            <p style="color: #856404; margin: 0; font-size: 16px; font-weight: bold;">Tienes ${complianceData.daysExtended} días adicionales para cumplir</p>
            <p style="color: #856404; margin: 10px 0 0 0; font-size: 14px;">Nuevo plazo límite: ${extendedDeadlineStr}</p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #999; font-size: 14px;">Plazo original vencido: ${originalDeadlineStr}</p>
            <p style="margin: 5px 0; color: #ff9800; font-weight: bold; font-size: 14px;">Nuevo plazo límite: ${extendedDeadlineStr}</p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Instrucciones del moderador</h3>
            <p style="color: #2d6a6b; font-size: 14px; margin: 0; white-space: pre-line;">${complianceData.moderatorInstructions}</p>
          </div>

          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #bf373e;">Advertencia importante</h3>
            <p style="color: #bf373e; font-size: 14px; margin: 0;">
              Esta es tu primera extensión de plazo. Si no cumples antes del nuevo plazo, se aplicarán consecuencias más severas:
            </p>
            <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>Suspensión temporal de tu cuenta (15 días)</li>
              <li>Nueva extensión de solo 2 días adicionales</li>
              <li>En caso de incumplimiento reiterado: baneo permanente</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Cumplir ahora
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0 0 0;">
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateOverdueText(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );
    const originalDeadlineStr = complianceData.originalDeadline.toLocaleString(
      'es',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
    );
    const extendedDeadlineStr = complianceData.extendedDeadline.toLocaleString(
      'es',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
      },
    );

    return `
PLAZO VENCIDO - CONEXIA

Hola ${recipientName},

Tu plazo de cumplimiento ha vencido. Hemos extendido tu plazo para darte una oportunidad adicional.

EXTENSIÓN DE PLAZO OTORGADA
Tienes ${complianceData.daysExtended} días adicionales para cumplir
Nuevo plazo límite: ${extendedDeadlineStr}

DETALLES DEL COMPROMISO
Servicio: ${complianceData.hiringTitle}
ID reclamo: #${complianceData.claimId}
Tipo de compromiso: ${typeLabel}
ID compromiso: #${complianceData.complianceId}
Plazo original vencido: ${originalDeadlineStr}
Nuevo plazo límite: ${extendedDeadlineStr}

INSTRUCCIONES DEL MODERADOR
${complianceData.moderatorInstructions}

ADVERTENCIA IMPORTANTE
Esta es tu primera extensión de plazo. Si no cumples antes del nuevo plazo, se aplicarán consecuencias más severas:

- Suspensión temporal de tu cuenta (15 días)
- En caso de incumplimiento reiterado: baneo permanente

Cumplir ahora: https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}

---
Si tienes dudas, contáctanos en soporte@conexia.com
El equipo de Conexia
    `;
  }

  /**
   * Email crítico cuando está en WARNING (segunda extensión)
   */
  async sendComplianceWarningEmail(
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
  ): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: 'Urgente: Última advertencia antes de suspensión',
      html: this.generateWarningHTML(recipientName, complianceData),
      text: this.generateWarningText(recipientName, complianceData),
    });
  }

  private generateWarningHTML(
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      finalDeadline: Date;
      moderatorInstructions: string;
    },
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );
    const finalDeadlineStr = complianceData.finalDeadline.toLocaleString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #d32f2f; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Última advertencia</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Has incumplido múltiples plazos. Tu cuenta ha sido suspendida temporalmente y esta es tu última oportunidad para evitar sanciones permanentes.
          </p>
          
          <div style="background-color: #ffcdd2; padding: 20px; border-left: 4px solid #b71c1c; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #b71c1c;">Última extensión otorgada</h3>
            <p style="color: #b71c1c; margin: 0; font-size: 16px; font-weight: bold;">Tienes 2 días adicionales para cumplir</p>
            <p style="color: #b71c1c; margin: 10px 0 0 0; font-size: 14px;">Nuevo plazo límite: ${finalDeadlineStr}</p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID compromiso:</strong> #${complianceData.complianceId}</p>
            <p style="margin: 5px 0; color: #d32f2f; font-weight: bold; font-size: 14px;">Plazo límite final: ${finalDeadlineStr}</p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Instrucciones del moderador</h3>
            <p style="color: #2d6a6b; font-size: 14px; margin: 0; white-space: pre-line;">${complianceData.moderatorInstructions}</p>
          </div>

          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #bf373e;">Consecuencias si no cumples</h3>
            <p style="color: #bf373e; font-size: 14px; margin: 0;">
              Si no cumples antes del plazo final, se aplicarán las siguientes sanciones:
            </p>
            <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>Baneo permanente de tu cuenta</li>
              <li>No podrás crear una nueva cuenta en la plataforma</li>
              <li>Todos tus servicios y proyectos serán cancelados</li>
              <li>Esta acción es irreversible</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Cumplir ahora
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0 0 0;">
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateWarningText(
    recipientName: string,
    complianceData: {
      complianceId: string;
      complianceType: string;
      claimId: string;
      hiringTitle: string;
      finalDeadline: Date;
      moderatorInstructions: string;
    },
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );
    const finalDeadlineStr = complianceData.finalDeadline.toLocaleString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    return `
ADVERTENCIA CRÍTICA DE CUMPLIMIENTO - CONEXIA

Hola ${recipientName},

Última oportunidad antes de suspensión de cuenta

Has incumplido múltiples plazos. Esta es tu última extensión antes de que se apliquen sanciones a tu cuenta.

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Plazo límite final: ${finalDeadlineStr}

INSTRUCCIONES DEL MODERADOR:
${complianceData.moderatorInstructions}

CONSECUENCIAS SI NO CUMPLES:
- Suspensión temporal de tu cuenta
- No podrás acceder a la plataforma durante el período de suspensión
- Tus servicios y proyectos quedarán inactivos
- Se notificará a la otra parte del incumplimiento
- Afectará tu reputación en la plataforma

Esta es tu última oportunidad. Por favor, cumple con el compromiso antes del ${finalDeadlineStr}.

Cumplir ahora: https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}

Si tienes dificultades para cumplir o necesitas asistencia, contacta inmediatamente a nuestro equipo de soporte.

---
Para consultas urgentes: soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Email cuando se escala a administradores (baneo permanente)
   */
  async sendComplianceEscalatedEmail(
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
  ): Promise<void> {
    await this.sendEmail({
      to: recipientEmail,
      subject: 'Incumplimiento escalado - Sanción aplicada',
      html: this.generateEscalatedHTML(recipientName, complianceData),
      text: this.generateEscalatedText(recipientName, complianceData),
    });
  }

  private generateEscalatedHTML(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );

    const deadlineStr = complianceData.deadline.toLocaleString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
    const extendedDeadlineStr = complianceData.extendedDeadline
      ? complianceData.extendedDeadline.toLocaleString('es', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
      : null;
    const finalDeadlineStr = complianceData.finalDeadline
      ? complianceData.finalDeadline.toLocaleString('es', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        })
      : null;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #b71c1c; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Cuenta suspendida permanentemente</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Lamentamos informarte que tu cuenta ha sido suspendida permanentemente debido a que no cumpliste con el compromiso establecido dentro de todos los plazos otorgados.
          </p>
          
          <div style="background-color: #ffcdd2; padding: 20px; border-left: 4px solid #b71c1c; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #b71c1c;">Suspensión permanente aplicada</h3>
            <p style="color: #b71c1c; margin: 0; font-size: 14px;">
              Tu cuenta ha sido desactivada de forma permanente. No podrás acceder a la plataforma ni crear una nueva cuenta.
            </p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso incumplido</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID compromiso:</strong> #${complianceData.complianceId}</p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Instrucciones del moderador</h3>
            <p style="color: #2d6a6b; font-size: 14px; margin: 0; white-space: pre-line;">${complianceData.moderatorInstructions}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Historial de plazos incumplidos</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Plazo original:</strong> ${deadlineStr}</p>
            ${extendedDeadlineStr ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Primera extensión (+3 días):</strong> ${extendedDeadlineStr}</p>` : ''}
            ${finalDeadlineStr ? `<p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Última extensión (+2 días):</strong> ${finalDeadlineStr}</p>` : ''}
            <p style="margin: 10px 0 0 0; color: #d32f2f; font-weight: bold; font-size: 14px;">Todos los plazos fueron incumplidos</p>
          </div>

          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #bf373e;">Consecuencias aplicadas</h3>
            <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>Tu cuenta ha sido desactivada permanentemente</li>
              <li>No podrás crear una nueva cuenta en la plataforma</li>
              <li>Todos tus servicios y proyectos han sido cancelados</li>
              <li>La otra parte ha sido notificada del incumplimiento</li>
              <li>Este incidente queda registrado permanentemente</li>
              <li>Esta acción es irreversible</li>
            </ul>
          </div>

          <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #1976d2;">¿Consideras que hay un error?</h3>
            <p style="color: #1565c0; font-size: 14px; margin: 0;">
              Si crees que esta decisión es incorrecta o hay circunstancias especiales, puedes apelar contactando a nuestro equipo de soporte dentro de los próximos 30 días.
            </p>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Para apelar esta decisión: <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0 0 0;">
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateEscalatedText(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );

    return `
CASO ESCALADO A ADMINISTRACIÓN - CONEXIA

Hola ${recipientName},

Tu caso ha sido escalado a administración

Se aplicarán sanciones a tu cuenta por incumplimiento reiterado.

Has incumplido múltiples plazos para el siguiente compromiso:

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}

INSTRUCCIONES QUE NO CUMPLISTE:
${complianceData.moderatorInstructions}

CONSECUENCIAS APLICADAS:
- Tu cuenta será evaluada por el equipo de administración
- Es probable que recibas una suspensión temporal o permanente
- La otra parte ha sido notificada del incumplimiento
- Este incidente quedará registrado en tu historial

Si consideras que hay un error o circunstancias especiales, contacta inmediatamente a nuestro equipo de soporte.

---
Para apelar esta decisión: soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Notifica al moderador sobre compliance escalado
   */
  async sendModeratorEscalationNotification(
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
  ): Promise<void> {
    await this.sendEmail({
      to: moderatorEmail,
      subject: `Compliance escalado - Nivel ${complianceData.warningLevel}`,
      html: this.generateModeratorEscalationHTML(
        moderatorName,
        responsibleUserName,
        complianceData,
      ),
      text: this.generateModeratorEscalationText(
        moderatorName,
        responsibleUserName,
        complianceData,
      ),
    });
  }

  private generateModeratorEscalationHTML(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff6b6b; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Compliance escalado</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${moderatorName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Un compliance ha sido escalado al nivel <strong>${complianceData.warningLevel}</strong> por incumplimientos reiterados.
          </p>
          
          <div style="background-color: #ffebee; padding: 20px; border-left: 4px solid #ff6b6b; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #c62828;">Atención requerida</h3>
            <p style="color: #c62828; margin: 0; font-size: 14px;">Nivel de advertencia: ${complianceData.warningLevel}/3</p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del incumplimiento</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Usuario responsable:</strong> ${responsibleUserName}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID compromiso:</strong> #${complianceData.complianceId}</p>
          </div>

          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Tus instrucciones originales</h3>
            <p style="color: #2d6a6b; font-size: 14px; margin: 0; white-space: pre-line;">${complianceData.moderatorInstructions}</p>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Acciones requeridas</h3>
            <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>Revisa el historial del usuario</li>
              <li>Evalúa si es necesaria una intervención adicional</li>
              <li>Considera contactar al usuario para entender la situación</li>
            </ul>
          </div>

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/admin/claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Sistema de moderación - Conexia
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0 0 0;">
            Este es un mensaje automático, por favor no respondas a este email.
          </p>
        </div>
      </div>
    `;
  }

  private generateModeratorEscalationText(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );

    return `
COMPLIANCE ESCALADO - CONEXIA

Hola ${moderatorName},

Un compliance ha sido escalado al nivel ${complianceData.warningLevel} por incumplimientos reiterados.

DETALLES:
Usuario responsable: ${responsibleUserName}
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Nivel de advertencia: ${complianceData.warningLevel}/3

TUS INSTRUCCIONES ORIGINALES:
${complianceData.moderatorInstructions}

ACCIONES REQUERIDAS:
- Revisa el historial del usuario
- Evalúa si es necesaria una intervención adicional
- Considera contactar al usuario para entender la situación

Ver reclamo: https://conexia.com/admin/claims?claimId=${complianceData.claimId}

---
Sistema de Moderación - Conexia
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }

  /**
   * Notifica a la otra parte sobre el incumplimiento
   */
  async sendComplianceNonComplianceNotification(
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
  ): Promise<void> {
    const subject =
      complianceData.warningLevel === 3
        ? `Cuenta de ${responsibleUserName} suspendida permanentemente`
        : `Actualización sobre el cumplimiento de ${responsibleUserName}`;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      html: this.generateNonComplianceNotificationHTML(
        recipientName,
        responsibleUserName,
        complianceData,
      ),
      text: this.generateNonComplianceNotificationText(
        recipientName,
        responsibleUserName,
        complianceData,
      ),
    });
  }

  private generateNonComplianceNotificationHTML(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );
    const isBanned = complianceData.warningLevel === 3;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: ${isBanned ? '#b71c1c' : '#ff9800'}; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${isBanned ? 'Cuenta suspendida permanentemente' : 'Actualización de cumplimiento'}</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          ${
            isBanned
              ? `
          <p style="color: #666; font-size: 14px;">
            Te informamos que <strong>${responsibleUserName}</strong> ha sido suspendido permanentemente de la plataforma debido a incumplimientos reiterados del compromiso establecido.
          </p>
          `
              : `
          <p style="color: #666; font-size: 14px;">
            Te informamos que <strong>${responsibleUserName}</strong> ha incumplido los plazos establecidos para el compromiso acordado.
          </p>
          `
          }
          
          <div style="background-color: ${isBanned ? '#ffcdd2' : '#fff3cd'}; padding: 20px; border-left: 4px solid ${isBanned ? '#b71c1c' : '#ff9800'}; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: ${isBanned ? '#b71c1c' : '#856404'};">${isBanned ? 'Suspensión permanente aplicada' : 'Incumplimiento de plazo'}</h3>
            <p style="color: ${isBanned ? '#b71c1c' : '#856404'}; margin: 0; font-size: 14px;">
              ${
                isBanned
                  ? 'La cuenta del usuario ha sido desactivada de forma permanente. No podrá volver a acceder a la plataforma.'
                  : `El usuario ha recibido advertencias por no cumplir en el plazo establecido (nivel ${complianceData.warningLevel}/3).`
              }
            </p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Detalles del compromiso</h3>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Servicio:</strong> ${complianceData.hiringTitle}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Tipo de compromiso:</strong> ${typeLabel}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>Usuario responsable:</strong> ${responsibleUserName}</p>
            <p style="margin: 5px 0; color: #666; font-size: 14px;"><strong>ID reclamo:</strong> #${complianceData.claimId}</p>
            ${isBanned ? `<p style="margin: 5px 0; color: #b71c1c; font-weight: bold; font-size: 14px;">Estado: Cuenta suspendida permanentemente</p>` : `<p style="margin: 5px 0; color: #ff9800; font-weight: bold; font-size: 14px;">Estado: Incumplido (nivel ${complianceData.warningLevel}/3)</p>`}
          </div>

          ${
            isBanned && complianceData.moderatorInstructions
              ? `
          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Qué debía cumplir</h3>
            <p style="color: #2d6a6b; font-size: 14px; margin: 0; white-space: pre-line;">${complianceData.moderatorInstructions}</p>
          </div>
          `
              : ''
          }

          ${
            isBanned
              ? `
          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">¿Qué significa esto para ti?</h3>
            <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>El usuario ya no tiene acceso a la plataforma</li>
              <li>No podrá completar el compromiso establecido</li>
              <li>Puedes abrir un nuevo reclamo si es necesario</li>
              <li>Nuestro equipo está disponible para asistirte con los próximos pasos</li>
            </ul>
          </div>
          `
              : `
          <div style="background-color: #e8f5f5; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">¿Qué está pasando?</h3>
            <ul style="color: #666; font-size: 14px; margin: 10px 0; padding-left: 20px;">
              <li>El usuario ha recibido advertencias por incumplimiento</li>
              <li>Los moderadores de Conexia están monitoreando la situación</li>
              <li>Si el incumplimiento continúa, se aplicarán sanciones más severas</li>
              <li>Te mantendremos informado sobre cualquier actualización</li>
            </ul>
          </div>
          `
          }

          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}" 
               style="display: inline-block; padding: 12px 24px; background-color: #48a6a7; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Ver reclamo
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
            Si tienes dudas, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center; margin: 5px 0 0 0;">
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateNonComplianceNotificationText(
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
  ): string {
    const typeLabel = this.getComplianceTypeLabel(
      complianceData.complianceType,
    );

    return `
ACTUALIZACIÓN DE CUMPLIMIENTO - CONEXIA

Hola ${recipientName},

Te informamos que ${responsibleUserName} ha incumplido los plazos establecidos para el siguiente compromiso:

DETALLES:
Servicio: ${complianceData.hiringTitle}
Tipo de compromiso: ${typeLabel}
Estado: Incumplido (nivel ${complianceData.warningLevel})

¿QUÉ SIGNIFICA ESTO?
- El usuario ha recibido advertencias por no cumplir en el plazo establecido
- Los moderadores de Conexia están monitoreando la situación
- Si el incumplimiento continúa, se aplicarán sanciones a la cuenta del usuario

Te mantendremos informado sobre cualquier actualización. Si tienes consultas, nuestro equipo está disponible para asistirte.

Ver reclamo: https://conexia.com/claims/my-claims?claimId=${complianceData.claimId}

---
Para consultas, contáctanos en soporte@conexia.com
Este es un mensaje automático, por favor no respondas a este email.
    `;
  }
}
