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
      tls: {
        // No verificar certificados en desarrollo
        rejectUnauthorized: false,
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

  async sendPostulationApprovedEmail(
    email: string,
    userName: string,
    projectId: number,
    projectTitle: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '🎉 ¡Tu postulación fue aprobada! - Conexia',
      html: this.generatePostulationApprovedEmailHTML(
        userName,
        projectTitle,
        projectId,
      ),
      text: this.generatePostulationApprovedEmailText(userName, projectTitle),
    });
  }

  async sendPostulationRejectedEmail(
    email: string,
    userName: string,
    projectTitle: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '📝 Tu postulación fue revisada - Conexia',
      html: this.generatePostulationRejectedEmailHTML(userName, projectTitle),
      text: this.generatePostulationRejectedEmailText(userName, projectTitle),
    });
  }

  async sendEvaluationExpiredEmail(
    email: string,
    userName: string,
    projectTitle: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '⏰ Tu plazo de evaluación ha expirado - Conexia',
      html: this.generateEvaluationExpiredEmailHTML(userName, projectTitle),
      text: this.generateEvaluationExpiredEmailText(userName, projectTitle),
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
}
