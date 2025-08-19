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

  protected async sendEmail(options: EmailOptions): Promise<void> {
    this.logger.log(`[MOCK EMAIL] Email would be sent to ${options.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[MOCK EMAIL] Content: ${options.text || options.html}`);

    return Promise.resolve();
  }
}
