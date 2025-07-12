import { Injectable } from '@nestjs/common';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export abstract class EmailService {
  /**
   * Envía un email de verificación
   */
  abstract sendVerificationEmail(
    email: string,
    verificationCode: string,
  ): Promise<void>;

  /**
   * Envía un email de bienvenida
   */
  abstract sendWelcomeEmail(email: string, userName?: string): Promise<void>;

  /**
   * Envía un email de recuperación de contraseña
   */
  abstract sendPasswordResetEmail(
    email: string,
    resetCode: string,
  ): Promise<void>;

  /**
   * Envía un email de confirmación de cambio de contraseña
   */
  abstract sendPasswordChangedEmail(email: string): Promise<void>;

  /**
   * Método genérico para enviar emails
   */
  protected abstract sendEmail(options: EmailOptions): Promise<void>;

  /**
   * Genera el HTML para el email de verificación
   */
  protected generateVerificationEmailHTML(verificationCode: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verificación de Cuenta</h2>
        <p>Tu código de verificación es:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0;">${verificationCode}</h1>
        </div>
        <p>Este código expirará en 15 minutos.</p>
        <p>Si no solicitaste este código, puedes ignorar este email.</p>
      </div>
    `;
  }

  /**
   * Genera el texto plano para el email de verificación
   */
  protected generateVerificationEmailText(verificationCode: string): string {
    return `
      Verificación de Cuenta

      Tu código de verificación es: ${verificationCode}

      Este código expirará en 15 minutos.

      Si no solicitaste este código, puedes ignorar este email.
    `;
  }
}
