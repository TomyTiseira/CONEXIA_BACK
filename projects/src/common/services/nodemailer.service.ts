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

  async sendPostulationApprovedEmail(
    email: string,
    userName: string,
    projectId: number,
    projectTitle: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: '¡Tu postulación fue aprobada! - Conexia',
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
      subject: 'Tu postulación fue revisada - Conexia',
      html: this.generatePostulationRejectedEmailHTML(userName, projectTitle),
      text: this.generatePostulationRejectedEmailText(userName, projectTitle),
    });
  }

  async sendPostulantBannedEmail(
    ownerEmail: string,
    ownerName: string,
    postulationData: {
      postulantName: string;
      projectTitle: string;
      projectId: number;
      wasAccepted: boolean;
      reason: string;
    },
  ): Promise<void> {
    const subject = postulationData.wasAccepted
      ? `Colaborador removido por moderación - ${postulationData.projectTitle} - Conexia`
      : `Actualización sobre postulación - ${postulationData.projectTitle} - Conexia`;

    await this.sendEmail({
      to: ownerEmail,
      subject,
      html: this.generatePostulantBannedEmailHTML(ownerName, postulationData),
      text: this.generatePostulantBannedEmailText(ownerName, postulationData),
    });
  }

  async sendProjectOwnerBannedEmail(
    postulantEmail: string,
    postulantName: string,
    projectData: {
      projectTitle: string;
      projectId: number;
      wasAccepted: boolean;
      reason: string;
    },
  ): Promise<void> {
    const subject = projectData.wasAccepted
      ? `Actualización importante - Proyecto ${projectData.projectTitle}`
      : `Actualización sobre tu postulación - ${projectData.projectTitle}`;

    await this.sendEmail({
      to: postulantEmail,
      subject,
      html: this.generateProjectOwnerBannedEmailHTML(postulantName, projectData),
      text: this.generateProjectOwnerBannedEmailText(postulantName, projectData),
    });
  }

  async sendCollaboratorSuspendedEmail(
    ownerEmail: string,
    ownerName: string,
    collaboratorData: {
      collaboratorName: string;
      projectTitle: string;
      projectId: number;
      suspensionEndsAt: Date;
    },
  ): Promise<void> {
    await this.sendEmail({
      to: ownerEmail,
      subject: `Colaborador suspendido temporalmente - ${collaboratorData.projectTitle}`,
      html: this.generateCollaboratorSuspendedEmailHTML(ownerName, collaboratorData),
      text: this.generateCollaboratorSuspendedEmailText(ownerName, collaboratorData),
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

  // ===== HTML Generators para notificaciones de moderación =====

  private generatePostulantBannedEmailHTML(
    ownerName: string,
    postulationData: any,
  ): string {
    const url = `${envs.frontendUrl}/project/${postulationData.projectId}`;
    
    if (postulationData.wasAccepted) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px; background-color: #ff4953; border-radius: 5px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Colaborador Removido</h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hola <strong>${ownerName}</strong>,</p>
            
            <p style="color: #666; font-size: 14px;">
              Lamentamos informarte que el colaborador <strong>${postulationData.postulantName}</strong> ha sido suspendido permanentemente y removido de tu proyecto.
            </p>
            
            <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #ff4953; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Detalles</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Proyecto:</strong> ${postulationData.projectTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Colaborador:</strong> ${postulationData.postulantName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Motivo:</strong> ${postulationData.reason}</p>
            </div>
            
            <div style="background-color: #ffedee; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #ff4953;">
              <p style="margin: 0 0 10px 0; color: #bf373e; font-size: 14px;"><strong>Acción requerida:</strong></p>
              <p style="margin: 0; color: #bf373e; font-size: 14px;">
                Deberás buscar un reemplazo para continuar con el proyecto.
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${url}" style="background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Ver Proyecto
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
            
            <p style="color: #9fa7a7; font-size: 12px; text-align: center;">
              Si tienes alguna pregunta, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
            </p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px; background-color: #48a6a7; border-radius: 5px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Postulación Cancelada</h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hola <strong>${ownerName}</strong>,</p>
            
            <p style="color: #666; font-size: 14px;">
              La postulación de <strong>${postulationData.postulantName}</strong> para tu proyecto ha sido cancelada automáticamente.
            </p>
            
            <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #48a6a7; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Detalles</h3>
              <p style="margin: 5px 0; color: #666;"><strong>Proyecto:</strong> ${postulationData.projectTitle}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Postulante:</strong> ${postulationData.postulantName}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Motivo:</strong> El postulante fue suspendido por infracciones</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Te invitamos a revisar otras postulaciones disponibles para tu proyecto.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${url}" style="background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Ver Proyecto
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
            
            <p style="color: #9fa7a7; font-size: 12px; text-align: center;">
              Si tienes alguna pregunta, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
            </p>
          </div>
        </div>
      `;
    }
  }

  private generatePostulantBannedEmailText(
    ownerName: string,
    postulationData: any,
  ): string {
    if (postulationData.wasAccepted) {
      return `
Colaborador Removido por Moderación

Hola ${ownerName},

Lamentamos informarte que el colaborador ${postulationData.postulantName} ha sido suspendido permanentemente y removido de tu proyecto.

Detalles:
- Proyecto: ${postulationData.projectTitle}
- Colaborador: ${postulationData.postulantName}
- Motivo: ${postulationData.reason}

Acción requerida:
Deberás buscar un reemplazo para continuar con el proyecto.

Ver proyecto: ${envs.frontendUrl}/project/${postulationData.projectId}

Si tienes alguna pregunta, contáctanos en soporte@conexia.com
      `;
    } else {
      return `
Postulación Cancelada

Hola ${ownerName},

La postulación de ${postulationData.postulantName} para tu proyecto "${postulationData.projectTitle}" ha sido cancelada automáticamente porque el postulante fue suspendido por infracciones.

Te invitamos a revisar otras postulaciones disponibles para tu proyecto.

Ver proyecto: ${envs.frontendUrl}/project/${postulationData.projectId}
      `;
    }
  }

  private generateProjectOwnerBannedEmailHTML(
    postulantName: string,
    projectData: any,
  ): string {
    const url = `${envs.frontendUrl}/project/${projectData.projectId}`;
    
    if (projectData.wasAccepted) {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px; background-color: #ff4953; border-radius: 5px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Proyecto Cerrado - Actualización Importante</h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hola <strong>${postulantName}</strong>,</p>
            
            <p style="color: #666; font-size: 14px;">
              Lamentamos informarte que el propietario del proyecto <strong>"${projectData.projectTitle}"</strong> ha sido <strong>suspendido permanentemente de la plataforma</strong> por infracciones graves a nuestras políticas.
            </p>
            
            <div style="background-color: #ffedee; padding: 20px; border-left: 4px solid #ff4953; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #bf373e;">Estado del Proyecto</h3>
              <p style="margin: 5px 0; color: #bf373e; font-weight: 500;">El proyecto ha sido cerrado de forma permanente y no será reactivado.</p>
            </div>
            
            <div style="background-color: #f5f6f6; padding: 20px; border-left: 4px solid #48a6a7; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Información Importante</h3>
              <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #666; font-size: 14px;">
                <li style="margin-bottom: 8px;">Tu trabajo y reputación <strong>no se ven afectados</strong> por esta situación</li>
                <li style="margin-bottom: 8px;">Puedes continuar postulándote a otros proyectos sin restricciones</li>
              </ul>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Lamentamos sinceramente las molestias que esto pueda causar. Esta medida es parte de nuestro compromiso de mantener un entorno seguro y confiable en Conexia.
            </p>

            <p style="color: #666; font-size: 14px;">
              Te invitamos a explorar otros proyectos similares donde puedas aportar tu talento y experiencia.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${envs.frontendUrl}/projects" style="background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Buscar Otros Proyectos
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
            
            <p style="color: #9fa7a7; font-size: 12px; text-align: center;">
              Si tienes alguna pregunta o necesitas asistencia con pagos o reembolsos, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
            </p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f6f6;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; padding: 20px; background-color: #48a6a7; border-radius: 5px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Postulación Cancelada</h1>
            </div>
            
            <p style="color: #333; font-size: 16px;">Hola <strong>${postulantName}</strong>,</p>
            
            <p style="color: #666; font-size: 14px;">
              Lamentamos informarte que tu postulación al proyecto <strong>"${projectData.projectTitle}"</strong> ha sido cancelada porque el propietario del proyecto fue suspendido por infracciones.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              Te invitamos a explorar otros proyectos similares en nuestra plataforma.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${envs.frontendUrl}/projects" style="background-color: #48a6a7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Buscar Proyectos
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e1e4e4; margin: 30px 0;">
            
            <p style="color: #9fa7a7; font-size: 12px; text-align: center;">
              Si tienes alguna pregunta, contáctanos en <a href="mailto:soporte@conexia.com" style="color: #48a6a7;">soporte@conexia.com</a>
            </p>
          </div>
        </div>
      `;
    }
  }

  private generateProjectOwnerBannedEmailText(
    postulantName: string,
    projectData: any,
  ): string {
    if (projectData.wasAccepted) {
      return `
Proyecto Cerrado - Actualización Importante

Hola ${postulantName},

Lamentamos informarte que el propietario del proyecto "${projectData.projectTitle}" ha sido suspendido permanentemente de la plataforma por infracciones graves a nuestras políticas.

ESTADO DEL PROYECTO:
⚠️ El proyecto ha sido cerrado de forma permanente y NO será reactivado.

INFORMACIÓN IMPORTANTE:
✓ Tu trabajo y reputación NO se ven afectados por esta situación
✓ Si hay pagos pendientes o reembolsos, nuestro equipo de soporte te contactará
✓ Puedes continuar postulándote a otros proyectos sin restricciones

Lamentamos sinceramente las molestias. Te invitamos a explorar otros proyectos similares donde puedas aportar tu talento.

Buscar otros proyectos: ${envs.frontendUrl}/projects

---
Si tienes alguna pregunta o necesitas asistencia con pagos o reembolsos, contáctanos en soporte@conexia.com
      `;
    } else {
      return `
Postulación Cancelada

Hola ${postulantName},

Lamentamos informarte que tu postulación al proyecto "${projectData.projectTitle}" ha sido cancelada porque el propietario fue suspendido por infracciones.

Te invitamos a explorar otros proyectos similares: ${envs.frontendUrl}/projects
      `;
    }
  }

  private generateCollaboratorSuspendedEmailHTML(
    ownerName: string,
    collaboratorData: any,
  ): string {
    const url = `${envs.frontendUrl}/project/${collaboratorData.projectId}`;
    const formattedDate = new Date(collaboratorData.suspensionEndsAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #17a2b8; margin: 0;">ℹ️ Información del Colaborador</h1>
          </div>
          
          <p style="color: #333; font-size: 16px;">Hola <strong>${ownerName}</strong>,</p>
          
          <p style="color: #666; font-size: 14px;">
            Te informamos que el colaborador <strong>${collaboratorData.collaboratorName}</strong> en tu proyecto ha sido suspendido temporalmente.
          </p>
          
          <div style="background-color: #d1ecf1; padding: 20px; border-left: 4px solid #17a2b8; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #0c5460;">📋 Detalles</h3>
            <p style="margin: 5px 0; color: #0c5460;"><strong>Proyecto:</strong> ${collaboratorData.projectTitle}</p>
            <p style="margin: 5px 0; color: #0c5460;"><strong>Colaborador:</strong> ${collaboratorData.collaboratorName}</p>
            <p style="margin: 5px 0; color: #0c5460;"><strong>Suspensión hasta:</strong> ${formattedDate}</p>
          </div>
          
          <div style="background-color: #d4edda; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #155724; font-size: 14px;">
              ✅ El colaborador <strong>puede seguir completando su trabajo actual</strong> durante la suspensión. No podrá aceptar nuevas tareas hasta que se reactive su cuenta.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Ver Proyecto
            </a>
          </div>
        </div>
      </div>
    `;
  }

  private generateCollaboratorSuspendedEmailText(
    ownerName: string,
    collaboratorData: any,
  ): string {
    const formattedDate = new Date(collaboratorData.suspensionEndsAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return `
Información del Colaborador

Hola ${ownerName},

Te informamos que el colaborador ${collaboratorData.collaboratorName} en tu proyecto "${collaboratorData.projectTitle}" ha sido suspendido temporalmente.

Detalles:
- Proyecto: ${collaboratorData.projectTitle}
- Colaborador: ${collaboratorData.collaboratorName}
- Suspensión hasta: ${formattedDate}

El colaborador puede seguir completando su trabajo actual durante la suspensión. No podrá aceptar nuevas tareas hasta que se reactive su cuenta.

Ver proyecto: ${envs.frontendUrl}/project/${collaboratorData.projectId}
    `;
  }
}

