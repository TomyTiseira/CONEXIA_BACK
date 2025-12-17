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
    claimData: {
      claimId: string;
      hiringTitle: string;
      status: 'resolved' | 'rejected';
      resolution: string;
      resolutionType?: string | null;
    },
  ): Promise<void> {
    const statusLabel =
      claimData.status === 'resolved' ? 'Resuelto' : 'Rechazado';
    const statusIcon = claimData.status === 'resolved' ? '✅' : '❌';

    await this.sendEmail({
      to: recipientEmail,
      subject: `${statusIcon} Reclamo ${statusLabel} - ${claimData.hiringTitle}`,
      html: this.generateClaimResolvedEmailHTML(
        recipientName,
        statusLabel,
        claimData,
      ),
      text: this.generateClaimResolvedEmailText(
        recipientName,
        statusLabel,
        claimData,
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
            <h1 style="color: #dc3545; margin: 0;">⚠️ Nuevo Reclamo</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            El <strong>${roleLabel}</strong> ha creado un reclamo para el servicio:
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid #dc3545; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${claimData.hiringTitle}</h3>
            <p style="margin: 5px 0; color: #666;"><strong>Motivo:</strong> ${claimData.claimType}</p>
            <p style="margin: 5px 0; color: #666;"><strong>Reclamante:</strong> ${claimData.claimantName}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>⚠️ Importante:</strong>
            </p> El servicio quedará pausado hasta que un moderador resuelva el reclamo.
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            <strong>Descripción del problema:</strong><br>
            ${claimData.description}
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/${claimData.claimId}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
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
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
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
    statusLabel: string,
    claimData: any,
  ): string {
    const statusColor = claimData.status === 'resolved' ? '#28a745' : '#dc3545';
    const statusIcon = claimData.status === 'resolved' ? '✅' : '❌';

    // Mapear tipo de resolución a texto legible
    const resolutionTypeLabels: Record<string, { label: string; description: string; icon: string }> = {
      'client_favor': {
        label: 'A favor del cliente',
        description: 'El servicio ha sido cancelado y el cliente no realizará el pago.',
        icon: '👤'
      },
      'provider_favor': {
        label: 'A favor del proveedor',
        description: 'El servicio se marca como finalizado y el proveedor recibirá el pago completo.',
        icon: '🏢'
      },
      'partial_agreement': {
        label: 'Acuerdo parcial',
        description: 'Ambas partes llegaron a un acuerdo. Se aplicarán los términos negociados.',
        icon: '🤝'
      }
    };

    const resolutionInfo = claimData.resolutionType && resolutionTypeLabels[claimData.resolutionType]
      ? resolutionTypeLabels[claimData.resolutionType]
      : null;

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: ${statusColor}; margin: 0;">${statusIcon} Reclamo ${statusLabel}</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            El reclamo para el servicio <strong>${claimData.hiringTitle}</strong> ha sido ${statusLabel.toLowerCase()} por un moderador.
          </p>
          
          ${resolutionInfo ? `
          <div style="background-color: #e7f3ff; padding: 20px; border-left: 4px solid #007bff; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">${resolutionInfo.icon} Tipo de Resolución: ${resolutionInfo.label}</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">${resolutionInfo.description}</p>
          </div>
          ` : ''}
          
          <div style="background-color: #f8f9fa; padding: 20px; border-left: 4px solid ${statusColor}; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Resolución:</h3>
            <p style="margin: 0; color: #666;">${claimData.resolution}</p>
          </div>
          
          <div style="background-color: ${claimData.status === 'resolved' ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: ${claimData.status === 'resolved' ? '#155724' : '#721c24'}; font-size: 14px;">
              ${
                claimData.status === 'resolved'
                  ? '✓ El servicio ha sido desbloqueado y puedes continuar con las acciones correspondientes.'
                  : '✗ El servicio ha sido desbloqueado. Por favor, revisa la resolución y continúa con el servicio normalmente.'
              }
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://conexia.com/claims/${claimData.claimId}" 
               style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
              Ver Detalles Completos
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              Si tienes dudas, contacta al equipo de soporte.
            </p>
          </div>
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
               style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
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
    statusLabel: string,
    claimData: any,
  ): string {
    const resolutionTypeLabels: Record<string, string> = {
      'client_favor': 'A favor del cliente - El servicio ha sido cancelado y el cliente no realizará el pago.',
      'provider_favor': 'A favor del proveedor - El servicio se marca como finalizado y el proveedor recibirá el pago completo.',
      'partial_agreement': 'Acuerdo parcial - Ambas partes llegaron a un acuerdo.'
    };

    const resolutionTypeText = claimData.resolutionType && resolutionTypeLabels[claimData.resolutionType]
      ? `\n\nTipo de Resolución:\n${resolutionTypeLabels[claimData.resolutionType]}`
      : '';

    return `
Hola ${recipientName},

El reclamo para el servicio "${claimData.hiringTitle}" ha sido ${statusLabel.toLowerCase()} por un moderador.${resolutionTypeText}

Resolución:
${claimData.resolution}

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
}
