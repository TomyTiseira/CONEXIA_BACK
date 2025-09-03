/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
    this.transporter = nodemailer.createTransport({
      host: envs.smtpHost,
      port: parseInt(envs.smtpPort, 10),
      secure: envs.smtpSecure === 'true',
      auth: {
        user: envs.smtpUser,
        pass: envs.smtpPass,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Error al verificar la conexión SMTP:', error);
      } else {
        this.logger.log('Servidor SMTP listo para enviar emails');
      }
    });
  }

  async sendConnectionRequestEmail(
    email: string,
    senderName: string,
    receiverName: string,
    message?: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '🤝 Nueva solicitud de conexión - Conexia',
      html: this.generateConnectionRequestEmailHTML(
        senderName,
        receiverName,
        message,
      ),
      text: this.generateConnectionRequestEmailText(
        senderName,
        receiverName,
        message,
      ),
    });
  }

  protected async sendEmail(options: EmailOptions): Promise<void> {
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

    return Promise.resolve();
  }
}
