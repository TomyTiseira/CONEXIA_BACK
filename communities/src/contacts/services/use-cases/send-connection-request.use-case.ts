import { Injectable } from '@nestjs/common';
import {
  CannotSendConnectionToSelfException,
  ConnectionAlreadyExistsException,
} from '../../../common/exceptions/connections.exceptions';
import { EmailService } from '../../../common/services/email.service';
import { UsersService } from '../../../common/services/users.service';
import { SendConnectionDto } from '../../dto/send-connection-request.dto';
import { ConnectionRepository } from '../../repositories/connection.repository';

@Injectable()
export class SendConnectionRequestUseCase {
  constructor(
    private readonly connectionRepository: ConnectionRepository,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  async execute(
    currentUserId: number,
    sendConnectionRequestDto: SendConnectionDto,
  ): Promise<{ message: string }> {
    const { receiverId, message } = sendConnectionRequestDto;

    // Validar que no se envíe solicitud a sí mismo
    if (currentUserId === receiverId) {
      throw new CannotSendConnectionToSelfException();
    }

    // Verificar si ya existe una solicitud pendiente
    const existingRequest =
      await this.connectionRepository.existsPendingRequest(
        currentUserId,
        receiverId,
      );

    if (existingRequest) {
      throw new ConnectionAlreadyExistsException();
    }

    // Obtener información de los usuarios con perfiles
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [senderResult, receiverResult] = await Promise.all([
      this.usersService.getUserWithProfile(currentUserId),
      this.usersService.getUserWithProfile(receiverId),
    ]);

    // Crear la solicitud de conexión
    await this.connectionRepository.create({
      senderId: currentUserId,
      receiverId,
      message,
    });

    // Enviar email de notificación
    if (receiverResult && receiverResult.user) {
      try {
        const senderName = senderResult?.profile
          ? `${senderResult.profile.name} ${senderResult.profile.lastName}`.trim()
          : 'Usuario';

        const receiverName = receiverResult.profile
          ? `${receiverResult.profile.name} ${receiverResult.profile.lastName}`.trim()
          : 'Usuario';

        await this.emailService.sendConnectionRequestEmail(
          receiverResult.user.email,
          senderName,
          receiverName,
          message,
        );
      } catch (error) {
        console.error('Error al enviar email de notificación:', error);
        // No lanzamos error para no fallar la operación principal
      }
    }

    return {
      message: 'connection request sent successfully',
    };
  }
}
