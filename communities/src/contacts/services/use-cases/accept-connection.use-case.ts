import { Injectable } from '@nestjs/common';
import {
  ConnectionAlreadyRespondedException,
  ConnectionNotFoundException,
  UnauthorizedConnectionResponseException,
} from '../../../common/exceptions/connections.exceptions';
import { AcceptConnectionDto } from '../../dto/accept-connection.dto';
import { ConnectionStatus } from '../../entities/connection.entity';
import { ConnectionRepository } from '../../repositories/connection.repository';

@Injectable()
export class AcceptConnectionUseCase {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  async execute(
    currentUserId: number,
    acceptConnectionDto: AcceptConnectionDto,
  ): Promise<{ message: string }> {
    const { requestId } = acceptConnectionDto;

    // Buscar la solicitud
    const connection = await this.connectionRepository.findById(requestId);

    if (!connection) {
      throw new ConnectionNotFoundException();
    }

    // Verificar que el usuario es el receptor de la solicitud
    if (connection.receiverId !== currentUserId) {
      throw new UnauthorizedConnectionResponseException();
    }

    // Verificar que la solicitud esté pendiente
    if (connection.status !== ConnectionStatus.PENDING) {
      throw new ConnectionAlreadyRespondedException();
    }

    // Aceptar la solicitud de conexión
    await this.connectionRepository.updateStatus(
      requestId,
      ConnectionStatus.ACCEPTED,
    );

    return {
      message: 'connection request accepted successfully',
    };
  }
}
