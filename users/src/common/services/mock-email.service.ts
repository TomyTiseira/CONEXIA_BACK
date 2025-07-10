import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions, EmailService } from './email.service';

@Injectable()
export class MockEmailService extends EmailService {
  private readonly logger = new Logger(MockEmailService.name);

  async sendVerificationEmail(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Verificación de Cuenta',
      html: this.generateVerificationEmailHTML(verificationCode),
      text: this.generateVerificationEmailText(verificationCode),
    });
  }

  async sendWelcomeEmail(email: string): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '🎉 ¡Ya eres parte de Conexia!',
      html: `<h1>🎉 ¡Ya eres parte de Conexia!</h1><p>¡Hola! 👋</p><p>¡Excelente! Tu cuenta ha sido verificada exitosamente y ahora eres parte de nuestra comunidad Conexia. ¡Tu viaje con Conexia acaba de comenzar!</p>`,
      text: `🎉 ¡Ya eres parte de Conexia!\n\n¡Hola! 👋\n\n¡Excelente! Tu cuenta ha sido verificada exitosamente y ahora eres parte de nuestra comunidad Conexia. ¡Tu viaje con Conexia acaba de comenzar!`,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetCode: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Recuperación de Contraseña',
      html: `<h1>Código de Recuperación</h1><p>Tu código es: <strong>${resetCode}</strong></p>`,
      text: `Código de Recuperación: ${resetCode}`,
    });
  }

  protected async sendEmail(options: EmailOptions): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Email would be sent to ${options.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[MOCK EMAIL] Content: ${options.text || options.html}`);

    return Promise.resolve();
  }
}
