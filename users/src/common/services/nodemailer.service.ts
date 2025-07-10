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
            <a href="${process.env.FRONTEND_URL || 'https://conexia.com'}" 
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
}
