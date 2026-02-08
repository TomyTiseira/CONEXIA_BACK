import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions, EmailService } from './email.service';

@Injectable()
export class MockEmailService extends EmailService {
  private readonly logger = new Logger(MockEmailService.name);

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
      ? `Colaborador removido por moderación - ${postulationData.projectTitle}`
      : `Actualización sobre postulación - ${postulationData.projectTitle}`;

    await this.sendEmail({
      to: ownerEmail,
      subject,
      html: '<mock>',
      text: `[MOCK] Postulante ${postulationData.postulantName} baneado en proyecto ${postulationData.projectTitle}`,
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
      html: '<mock>',
      text: `[MOCK] Owner del proyecto ${projectData.projectTitle} fue baneado`,
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
      html: '<mock>',
      text: `[MOCK] Colaborador ${collaboratorData.collaboratorName} suspendido hasta ${collaboratorData.suspensionEndsAt}`,
    });
  }

  async sendEvaluationExpiredEmail(
    email: string,
    userName: string,
    projectTitle: string,
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Tu plazo de evaluación ha expirado - Conexia',
      html: this.generateEvaluationExpiredEmailHTML(userName, projectTitle),
      text: this.generateEvaluationExpiredEmailText(userName, projectTitle),
    });
  }

  protected async sendEmail(options: EmailOptions): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Email would be sent to ${options.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[MOCK EMAIL] Content: ${options.text || options.html}`);

    return Promise.resolve();
  }
}
