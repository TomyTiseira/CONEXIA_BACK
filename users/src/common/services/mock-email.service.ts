import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions, EmailService } from './email.service';

@Injectable()
export class MockEmailService extends EmailService {
  private readonly logger = new Logger(MockEmailService.name);

  async sendVerificationEmail(
    email: string,
    verificationCode: string,
  ): Promise<void> {
    this.logger.log(
      `[MOCK EMAIL] Verification code ${verificationCode} sent to ${email}`,
    );

    await this.sendEmail({
      to: email,
      subject: 'Verificación de Cuenta',
      html: this.generateVerificationEmailHTML(verificationCode),
      text: this.generateVerificationEmailText(verificationCode),
    });
  }

  async sendWelcomeEmail(email: string, userName?: string): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Welcome email sent to ${email}`);

    await this.sendEmail({
      to: email,
      subject: '¡Bienvenido a nuestra plataforma!',
      html: `<h1>¡Bienvenido${userName ? ` ${userName}` : ''}!</h1><p>Tu cuenta ha sido verificada exitosamente.</p>`,
      text: `¡Bienvenido${userName ? ` ${userName}` : ''}! Tu cuenta ha sido verificada exitosamente.`,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetCode: string,
  ): Promise<void> {
    this.logger.log(
      `[MOCK EMAIL] Password reset code ${resetCode} sent to ${email}`,
    );

    await this.sendEmail({
      to: email,
      subject: 'Recuperación de Contraseña',
      html: `<h1>Código de Recuperación</h1><p>Tu código es: <strong>${resetCode}</strong></p>`,
      text: `Código de Recuperación: ${resetCode}`,
    });
  }

  protected async sendEmail(options: EmailOptions): Promise<void> {
    // En desarrollo, solo logueamos el email
    this.logger.log(`[MOCK EMAIL] Email would be sent to ${options.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[MOCK EMAIL] Content: ${options.text || options.html}`);

    // Simular delay de envío
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
