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
   * Envía un email de notificación de postulación aprobada
   */
  abstract sendPostulationApprovedEmail(
    email: string,
    userName: string,
    projectId: number,
    projectTitle: string,
  ): Promise<void>;

  /**
   * Envía un email de notificación de postulación rechazada
   */
  abstract sendPostulationRejectedEmail(
    email: string,
    userName: string,
    projectTitle: string,
  ): Promise<void>;

  /**
   * Método genérico para enviar emails
   */
  protected abstract sendEmail(options: EmailOptions): Promise<void>;

  /**
   * Genera el HTML para el email de postulación aprobada
   */
  protected generatePostulationApprovedEmailHTML(
    userName: string,
    projectTitle: string,
    projectId: number,
  ): string {
    const url = `${envs.frontendUrl}/project/${projectId}`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #28a745; text-align: center; margin-bottom: 30px;">🎉 ¡Tu postulación fue aprobada!</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ¡Hola ${userName}! 👋
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ¡Excelente noticia! Tu postulación para el proyecto <strong>"${projectTitle}"</strong> ha sido aprobada exitosamente.
          </p>
          <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #155724; margin: 0; font-weight: bold;">
              ✅ Postulación aprobada
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            El propietario del proyecto se pondrá en contacto contigo pronto para coordinar los próximos pasos de la colaboración.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ¡Felicidades por esta nueva oportunidad! Estamos seguros de que será una experiencia muy enriquecedora.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              🚀 Ver el proyecto
            </a>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">
            Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para ti!
          </p>
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
            ¡Mucho éxito en tu nuevo proyecto! 💚
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Genera el texto plano para el email de postulación aprobada
   */
  protected generatePostulationApprovedEmailText(
    userName: string,
    projectTitle: string,
  ): string {
    return `
      🎉 ¡Tu postulación fue aprobada!

      ¡Hola ${userName}! 👋

      ¡Excelente noticia! Tu postulación para el proyecto "${projectTitle}" ha sido aprobada exitosamente.

      ✅ Postulación aprobada

      El propietario del proyecto se pondrá en contacto contigo pronto para coordinar los próximos pasos de la colaboración.

      ¡Felicidades por esta nueva oportunidad! Estamos seguros de que será una experiencia muy enriquecedora.

      Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. ¡Estamos aquí para ti!

      ¡Mucho éxito en tu nuevo proyecto! 💚

      Saludos,
      El equipo de Conexia
    `;
  }

  /**
   * Genera el HTML para el email de postulación rechazada
   */
  protected generatePostulationRejectedEmailHTML(
    userName: string,
    projectTitle: string,
  ): string {
    // Para el email de rechazo, redirigimos a la búsqueda de proyectos
    const url = `${envs.frontendUrl}/project/search`;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h1 style="color: #dc3545; text-align: center; margin-bottom: 30px;">📝 Tu postulación fue revisada</h1>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            ¡Hola ${userName}! 👋
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Hemos revisado tu postulación para el proyecto <strong>"${projectTitle}"</strong> y lamentamos informarte que no ha sido seleccionada en esta oportunidad.
          </p>
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="color: #721c24; margin: 0; font-weight: bold;">
              📋 Postulación no seleccionada
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Queremos que sepas que esto no es un reflejo de tus habilidades o experiencia. Cada proyecto tiene requisitos específicos y en esta ocasión no fue la combinación adecuada.
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Te animamos a seguir explorando otras oportunidades en nuestra plataforma. ¡Hay muchos proyectos interesantes esperando por colaboradores como tú!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              🔍 Explorar más proyectos
            </a>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">
            Si tienes alguna pregunta o necesitas ayuda para mejorar tu perfil, no dudes en contactarnos. ¡Estamos aquí para apoyarte!
          </p>
          <p style="font-size: 14px; color: #666; text-align: center; margin-top: 20px;">
            ¡No te desanimes! Cada "no" te acerca más al "sí" perfecto. 💪
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Genera el texto plano para el email de postulación rechazada
   */
  protected generatePostulationRejectedEmailText(
    userName: string,
    projectTitle: string,
  ): string {
    return `
      📝 Tu postulación fue revisada

      ¡Hola ${userName}! 👋

      Hemos revisado tu postulación para el proyecto "${projectTitle}" y lamentamos informarte que no ha sido seleccionada en esta oportunidad.

      📋 Postulación no seleccionada

      Queremos que sepas que esto no es un reflejo de tus habilidades o experiencia. Cada proyecto tiene requisitos específicos y en esta ocasión no fue la combinación adecuada.

      Te animamos a seguir explorando otras oportunidades en nuestra plataforma. ¡Hay muchos proyectos interesantes esperando por colaboradores como tú!

      Si tienes alguna pregunta o necesitas ayuda para mejorar tu perfil, no dudes en contactarnos. ¡Estamos aquí para apoyarte!

      ¡No te desanimes! Cada "no" te acerca más al "sí" perfecto. 💪

      Saludos,
      El equipo de Conexia
    `;
  }
}
