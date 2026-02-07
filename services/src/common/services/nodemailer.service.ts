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
              <strong>⚠️ Importante:</strong>
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
    statusLabel: string,
    claimData: any,
  ): string {
    const statusColor = claimData.status === 'resolved' ? '#28a745' : '#ff4953';
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
          <div style="background-color: #e7f3ff; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
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
               style="display: inline-block; background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold;">
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
              <strong>📋 Información sobre reembolso:</strong>
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
    const html = this.generateServiceTerminatedClientBannedEmailHTML(providerName, serviceData);
    const text = this.generateServiceTerminatedClientBannedEmailText(providerName, serviceData);

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
      subject: `📋 Se te han asignado compromisos - ${claimData.hiringTitle}`,
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
        const typeLabel = complianceTypeLabels[c.complianceType] || c.complianceType;
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
            <h1 style="color: white; margin: 0; font-size: 24px;">📋 Compromisos Asignados</h1>
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
📋 COMPROMISOS ASIGNADOS - CONEXIA

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
}
