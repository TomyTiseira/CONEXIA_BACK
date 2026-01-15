import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { envs } from 'src/config/envs';
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
    // Configuración temporal con Ethereal para desarrollo
    this.transporter = nodemailer.createTransport({
      host: envs.smtpHost,
      port: parseInt(envs.smtpPort, 10),
      secure: envs.smtpSecure === 'true', // true para 465, false para otros puertos
      auth: {
        user: envs.smtpUser,
        pass: envs.smtpPass,
      },
    });

    // Verificar la conexión
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Error al verificar la conexión SMTP:', error);
      } else {
        this.logger.log('Servidor SMTP listo para enviar emails');
      }
    });
  }

  async sendVerificationEmail(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Verificación de Cuenta - Conexia',
      html: this.generateVerificationEmailHTML(verificationCode),
      text: this.generateVerificationEmailText(verificationCode),
    });
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '¡Bienvenido a Conexia!',
      html: this.generateWelcomeEmailHTML(),
      text: this.generateWelcomeEmailText(),
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetCode: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Recuperación de Contraseña - Conexia',
      html: this.generatePasswordResetEmailHTML(resetCode),
      text: this.generatePasswordResetEmailText(resetCode),
    });
  }

  async sendPasswordChangedEmail(email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Contraseña Cambiada Exitosamente - Conexia',
      html: this.generatePasswordChangedEmailHTML(),
      text: this.generatePasswordChangedEmailText(),
    });
  }

  async sendModerationAnalysisEmail(
    to: string,
    notification: {
      userId: number;
      classification: string;
      totalReports: number;
      aiSummary: string;
    },
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Nuevo análisis de reportes pendiente (usuario ${notification.userId})`,
      html: `<p>Hay un nuevo análisis pendiente para el usuario <b>${notification.userId}</b>.<br>
        Clasificación: <b>${notification.classification}</b><br>
        Total de reportes: <b>${notification.totalReports}</b><br>
        Resumen IA: <pre>${notification.aiSummary}</pre></p>`,
    });
  }

  protected async sendEmail(options: EmailOptions): Promise<void> {
    // Enviar email de forma asíncrona sin bloquear la respuesta
    this.transporter
      .sendMail({
        from: envs.emailFrom,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      })
      .then((info) => {
        this.logger.log(
          `Email enviado exitosamente desde ${envs.emailFrom} a ${options.to}: ${info.messageId}`,
        );
      })
      .catch((error) => {
        this.logger.error('Error al enviar email:', error);
      });

    // Retornar inmediatamente sin esperar el envío
    return Promise.resolve();
  }

  /**
   * Genera el HTML para el email de bienvenida
   */
  private generateWelcomeEmailHTML(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #007bff; text-align: center; margin-bottom: 30px;">🎉 ¡Ya eres parte de Conexia!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ¡Hola! 👋
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ¡Excelente! Tu cuenta ha sido verificada exitosamente y ahora eres parte de nuestra comunidad Conexia. 
            Estamos muy emocionados de tenerte con nosotros.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Ya puedes comenzar a explorar todas las funcionalidades que tenemos preparadas para ti. 
            ¡Tu viaje con Conexia acaba de comenzar!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://conexia-front.vercel.app'}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              🚀 Comenzar mi experiencia
            </a>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para ti!
          </p>
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
            ¡Bienvenido a la familia Conexia! 💙
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Genera el texto plano para el email de bienvenida
   */
  private generateWelcomeEmailText(): string {
    return `
      🎉 ¡Ya eres parte de Conexia!

      ¡Hola! 👋

      ¡Excelente! Tu cuenta ha sido verificada exitosamente y ahora eres parte de nuestra comunidad Conexia. 
      Estamos muy emocionados de tenerte con nosotros.

      Ya puedes comenzar a explorar todas las funcionalidades que tenemos preparadas para ti. 
      ¡Tu viaje con Conexia acaba de comenzar

      Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para ti!

      ¡Bienvenido a la familia Conexia! 💙

      Saludos,
      El equipo de Conexia
    `;
  }

  /**
   * Genera el HTML para el email de recuperación de contraseña
   */
  private generatePasswordResetEmailHTML(resetCode: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #dc3545; text-align: center; margin-bottom: 30px;">Recuperación de Contraseña</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Has solicitado restablecer tu contraseña. Tu código de recuperación es:
          </p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h1 style="color: #dc3545; font-size: 32px; margin: 0; letter-spacing: 5px;">${resetCode}</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Este código expirará en 15 minutos por seguridad.
          </p>
          <p style="font-size: 14px; color: #666;">
            Si no solicitaste este código, puedes ignorar este email de forma segura.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Genera el texto plano para el email de recuperación de contraseña
   */
  private generatePasswordResetEmailText(resetCode: string): string {
    return `
      Recuperación de Contraseña

      Has solicitado restablecer tu contraseña. Tu código de recuperación es:

      ${resetCode}

      Este código expirará en 15 minutos por seguridad.

      Si no solicitaste este código, puedes ignorar este email de forma segura.

      Saludos,
      El equipo de Conexia
    `;
  }

  /**
   * Genera el HTML para el email de confirmación de cambio de contraseña
   */
  private generatePasswordChangedEmailHTML(): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #28a745; text-align: center; margin-bottom: 30px;">Contraseña Cambiada Exitosamente</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Tu contraseña ha sido actualizada exitosamente.
          </p>
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #155724; margin: 0; font-weight: bold;">
              ✅ Cambio de contraseña confirmado
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Si no realizaste este cambio, contacta inmediatamente con nuestro equipo de soporte.
          </p>
          <p style="font-size: 14px; color: #666; text-align: center;">
            Por seguridad, te recomendamos mantener tu contraseña segura y no compartirla con nadie.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Genera el texto plano para el email de confirmación de cambio de contraseña
   */
  private generatePasswordChangedEmailText(): string {
    return `
      Contraseña Cambiada Exitosamente

      Tu contraseña ha sido actualizada exitosamente.

      ✅ Cambio de contraseña confirmado

      Si no realizaste este cambio, contacta inmediatamente con nuestro equipo de soporte.

      Por seguridad, te recomendamos mantener tu contraseña segura y no compartirla con nadie.

      Saludos,
      El equipo de Conexia
    `;
  }

  /**
   * Envía email de cuenta baneada
   */
  async sendAccountBannedEmail(
    email: string,
    userName: string,
    reason: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '⚠️ Cuenta Baneada - Conexia',
      html: this.generateAccountBannedEmailHTML(userName, reason),
      text: this.generateAccountBannedEmailText(userName, reason),
    });
  }

  /**
   * Envía email de cuenta suspendida
   */
  async sendAccountSuspendedEmail(
    email: string,
    userName: string,
    reason: string,
    days: number,
    expiresAt: Date,
    commitments: any,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '⏸️ Cuenta Suspendida Temporalmente - Conexia',
      html: this.generateAccountSuspendedEmailHTML(userName, reason, days, expiresAt, commitments),
      text: this.generateAccountSuspendedEmailText(userName, reason, days, expiresAt, commitments),
    });
  }

  /**
   * Envía email de reactivación de cuenta
   */
  async sendAccountReactivatedEmail(
    email: string,
    userName: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '✅ Cuenta Reactivada - Conexia',
      html: this.generateAccountReactivatedEmailHTML(userName),
      text: this.generateAccountReactivatedEmailText(userName),
    });
  }

  private generateAccountBannedEmailHTML(userName: string, reason: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff4953; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Cuenta Suspendida Permanentemente</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${userName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Lamentamos informarte que tu cuenta en Conexia ha sido <strong>suspendida permanentemente</strong> 
            debido a violaciones graves de nuestras políticas y términos de servicio.
          </p>
          
          <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Motivo de la suspensión</h3>
            <p style="color: #bf373e; margin: 0; font-size: 14px;">${reason}</p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Consecuencias de la suspensión</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
              <li>Tu cuenta ha sido bloqueada permanentemente</li>
              <li>Todos tus servicios activos han sido finalizados</li>
              <li>Tus proyectos han sido suspendidos</li>
              <li>No podrás acceder nuevamente a la plataforma</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Si consideras que esta decisión fue tomada por error o deseas apelar, 
            puedes contactar a nuestro equipo de soporte en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Gracias por tu comprensión.<br>
            El equipo de Moderación de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateAccountBannedEmailText(userName: string, reason: string): string {
    return `
      ⚠️ Cuenta Baneada

      Hola ${userName},

      Lamentamos informarte que tu cuenta en Conexia ha sido baneada permanentemente 
      debido a violaciones graves de nuestras políticas y términos de servicio.

      Motivo: ${reason}

      Consecuencias del baneo:
      - Tu cuenta ha sido bloqueada permanentemente
      - Todos tus servicios activos han sido finalizados
      - Tus proyectos han sido suspendidos
      - No podrás acceder nuevamente a la plataforma

      Si consideras que este baneo fue un error o deseas apelar esta decisión, 
      puedes contactar a nuestro equipo de soporte en soporte@conexia.com.

      Gracias por tu comprensión.
      El equipo de Moderación de Conexia
    `;
  }

  private generateAccountSuspendedEmailHTML(
    userName: string,
    reason: string,
    days: number,
    expiresAt: Date,
    commitments: any,
  ): string {
    const expiresDate = expiresAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    let commitmentsHTML = '';
    if (commitments) {
      const activeServices = commitments.services?.length || 0;
      const activeProjects = commitments.ownProjects?.length || 0;
      const activeCollaborations = commitments.collaborations?.length || 0;

      if (activeServices + activeProjects + activeCollaborations > 0) {
        commitmentsHTML = `
          <div style="background-color: #fff3cd; border-left: 4px solid #ff9800; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">📋 Compromisos activos</h3>
            ${activeServices > 0 ? `<p style="color: #856404; margin: 5px 0; font-size: 14px;">• ${activeServices} servicio(s) que estás prestando</p>` : ''}
            ${activeProjects > 0 ? `<p style="color: #856404; margin: 5px 0; font-size: 14px;">• ${activeProjects} proyecto(s) como dueño</p>` : ''}
            ${activeCollaborations > 0 ? `<p style="color: #856404; margin: 5px 0; font-size: 14px;">• ${activeCollaborations} colaboración(es) en proyectos</p>` : ''}
            <p style="color: #856404; margin: 15px 0 0 0; font-size: 13px;">
              <strong>Importante:</strong> Debes completar estos compromisos. No puedes crear nuevos servicios 
              ni proyectos hasta que tu cuenta sea reactivada.
            </p>
          </div>
        `;
      }
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #ff9800; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Cuenta Suspendida Temporalmente</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${userName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Te informamos que tu cuenta en Conexia ha sido <strong>suspendida temporalmente por ${days} días</strong> 
            debido a violaciones de nuestras políticas.
          </p>
          
          <div style="background-color: #fff3e0; padding: 20px; border-left: 4px solid #ff9800; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Motivo de la suspensión</h3>
            <p style="color: #e65100; margin: 0; font-size: 14px;">${reason}</p>
          </div>
          
          ${commitmentsHTML}
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #333;">Fecha de reactivación</h3>
            <p style="color: #ff9800; margin: 0; font-size: 20px; font-weight: bold;">${expiresDate}</p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Durante la suspensión</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
              <li>No podrás publicar nuevos servicios ni proyectos</li>
              <li>Tus publicaciones existentes estarán ocultas</li>
              <li>Podrás completar tus compromisos activos</li>
              <li>Tu cuenta se reactivará automáticamente el ${expiresDate}</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Si tienes dudas o deseas apelar esta decisión, puedes contactar a nuestro equipo de soporte en 
            <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            Gracias por tu comprensión.<br>
            El equipo de Moderación de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateAccountSuspendedEmailText(
    userName: string,
    reason: string,
    days: number,
    expiresAt: Date,
    commitments: any,
  ): string {
    const expiresDate = expiresAt.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    let commitmentsText = '';
    if (commitments) {
      const activeServices = commitments.services?.length || 0;
      const activeProjects = commitments.ownProjects?.length || 0;
      const activeCollaborations = commitments.collaborations?.length || 0;

      if (activeServices + activeProjects + activeCollaborations > 0) {
        commitmentsText = `\n📋 Compromisos activos:\n`;
        if (activeServices > 0) commitmentsText += `• ${activeServices} servicio(s) que estás prestando\n`;
        if (activeProjects > 0) commitmentsText += `• ${activeProjects} proyecto(s) como dueño\n`;
        if (activeCollaborations > 0) commitmentsText += `• ${activeCollaborations} colaboración(es) en proyectos\n`;
        commitmentsText += `\nImportante: Debes completar estos compromisos. No puedes crear nuevos servicios ni proyectos hasta que tu cuenta sea reactivada.\n`;
      }
    }

    return `
      ⏸️ Cuenta Suspendida Temporalmente

      Hola ${userName},

      Te informamos que tu cuenta en Conexia ha sido suspendida temporalmente por ${days} días 
      debido a violaciones de nuestras políticas.

      Motivo: ${reason}
      ${commitmentsText}
      Fecha de reactivación: ${expiresDate}

      Durante la suspensión:
      - No podrás publicar nuevos servicios ni proyectos
      - No podrás postularte a proyectos de otros usuarios
      - No podrás recibir nuevas postulaciones en tus proyecto
      - No podrás solicitar cotizaciones en servicios de otros usuarios
      - No podrás recibir solicitudes de cotización en tus servicios
      - No podrás crear publicaciones en comunidad
      - Tus publicaciones existentes estarán ocultas
      - Podrás completar tus compromisos activos
      - Tu cuenta se reactivará automáticamente el ${expiresDate}

      Si tienes dudas o deseas apelar esta decisión, contacta a soporte@conexia.com.

      Gracias por tu comprensión.
      El equipo de Moderación de Conexia
    `;
  }

  private generateAccountReactivatedEmailHTML(userName: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; padding: 20px; background-color: #28a745; border-radius: 5px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">¡Cuenta Reactivada!</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${userName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            ¡Buenas noticias! Tu cuenta en Conexia ha sido <strong>reactivada exitosamente</strong>. 
            El período de suspensión ha finalizado y ahora puedes volver a utilizar todas las funcionalidades de la plataforma.
          </p>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-left: 4px solid #28a745; margin: 20px 0;">
            <p style="color: #2e7d32; margin: 0; font-weight: bold; font-size: 16px;">
              ✅ Tu cuenta está activa nuevamente
            </p>
          </div>
          
          <div style="background-color: #f5f6f6; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #333;">Ahora puedes</h3>
            <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px; line-height: 1.8;">
              <li>Publicar nuevos servicios y proyectos</li>
              <li>Participar en la comunidad</li>
              <li>Contratar servicios de otros usuarios</li>
              <li>Postularte a proyectos</li>
              <li>Acceder a todas las funcionalidades de la plataforma</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://conexia-front.vercel.app'}" 
               style="background-color: #28a745; color: white; padding: 14px 35px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
              Volver a Conexia
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Te recordamos respetar siempre nuestras políticas y términos de servicio para mantener 
            una comunidad sana y productiva.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
          
          <p style="color: #9fa7a7; font-size: 12px; text-align: center; margin: 0;">
            ¡Bienvenido de vuelta!<br>
            El equipo de Conexia
          </p>
        </div>
      </div>
    `;
  }

  private generateAccountReactivatedEmailText(userName: string): string {
    return `
      ✅ ¡Cuenta Reactivada!

      Hola ${userName},

      ¡Buenas noticias! Tu cuenta en Conexia ha sido reactivada exitosamente. 
      El período de suspensión ha finalizado y ahora puedes volver a utilizar todas las funcionalidades de la plataforma.

      ✅ Tu cuenta está activa nuevamente

      Ahora puedes:
      - Publicar nuevos servicios y proyectos
      - Postularte a proyectos de otros usuarios
      - Recibir nuevas postulaciones en tus proyectos
      - Solicitar cotizaciones en servicios de otros usuarios
      - Recibir solicitudes de cotización en tus servicios
      - Crear publicaciones en comunidad.

      Te recordamos respetar siempre nuestras políticas y términos de servicio para mantener 
      una comunidad sana y productiva.

      ¡Bienvenido de vuelta!
      El equipo de Conexia
    `;
  }
}
