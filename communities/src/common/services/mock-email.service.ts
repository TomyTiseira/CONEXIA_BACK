import { Injectable, Logger } from '@nestjs/common';
import { EmailOptions, EmailService } from './email.service';

@Injectable()
export class MockEmailService extends EmailService {
  private readonly logger = new Logger(MockEmailService.name);

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
    this.logger.log(`[MOCK EMAIL] Email would be sent to ${options.to}`);
    this.logger.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    this.logger.log(`[MOCK EMAIL] Content: ${options.text || options.html}`);

    return Promise.resolve();
  }
}
