import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../../common/services/email.service';

@Controller()
export class ModerationNotificationController {
  private readonly logger = new Logger(ModerationNotificationController.name);

  constructor(
    @Inject(EmailService) private readonly emailService: EmailService,
  ) {}

  /**
   * Handler para notificar a moderadores sobre análisis pendientes
   */
  @MessagePattern('notifyModeratorsAboutReports')
  async handleNotifyModerators(
    @Payload() data: { notifications: any[]; count: number },
  ) {
    this.logger.log(
      `Recibida solicitud de notificación a moderadores (${data.count} análisis)`,
    );
    const moderatorEmails = await this.getModeratorEmails();
    for (const notification of data.notifications) {
      for (const email of moderatorEmails) {
        await this.emailService.sendModerationAnalysisEmail(
          email,
          notification,
        );
      }
    }
    this.logger.log('Notificaciones de análisis enviadas a moderadores');
    return { success: true };
  }

  // Simulación: deberías implementar la consulta real.
  // Cuando tengamos la casilla de correos implementada hay que terminar esta funcionalidad para enviar a los usuarios moderadores/admins
  private async getModeratorEmails(): Promise<string[]> {
    // En desarrollo, enviar los correos de análisis a la casilla configurada en .env (Ethereal)
    const { envs } = await import('../../config/envs');
    return [envs.emailFrom];
  }
}
