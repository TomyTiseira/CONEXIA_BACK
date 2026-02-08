import { Injectable } from '@nestjs/common';
import { envs } from 'src/config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export abstract class EmailService {
  /**
   * Envía un email de notificación de solicitud de conexión
   */
  abstract sendConnectionRequestEmail(
    email: string,
    senderName: string,
    receiverName: string,
    message?: string,
  ): Promise<void>;

  /**
   * Método genérico para enviar emails
   */
  protected abstract sendEmail(options: EmailOptions): Promise<void>;

  /**
   * Genera el HTML para el email de solicitud de conexión
   */
  protected generateConnectionRequestEmailHTML(
    senderName: string,
    receiverName: string,
    message?: string,
  ): string {
    const url = `${envs.frontendUrl}/solicitudes`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #007bff; text-align: center; margin-bottom: 30px;">🤝 Nueva solicitud de conexión</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ¡Hola ${receiverName}! 👋
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            <strong>${senderName}</strong> quiere conectarse contigo en Conexia.
          </p>
          ${
            message
              ? `
          <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #1565c0; margin: 0; font-style: italic;">
              "${message}"
            </p>
          </div>
          `
              : ''
          }
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Puedes revisar y responder a esta solicitud desde tu panel de contactos.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              📋 Ver solicitudes
            </a>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">
            ¡Conecta con otros profesionales y expande tu red en Conexia!
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Genera el texto plano para el email de solicitud de conexión
   */
  protected generateConnectionRequestEmailText(
    senderName: string,
    receiverName: string,
    message?: string,
  ): string {
    return `
      🤝 Nueva solicitud de conexión

      ¡Hola ${receiverName}! 👋

      ${senderName} quiere conectarse contigo en Conexia.

      ${message ? `Mensaje: "${message}"` : ''}

      Puedes revisar y responder a esta solicitud desde tu panel de contactos.

      ¡Conecta con otros profesionales y expande tu red en Conexia!

      Saludos,
      El equipo de Conexia
    `;
  }
}
