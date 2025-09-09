import { Injectable } from '@nestjs/common';
import {
  ConnectionAlreadyRespondedException,
  ConnectionNotFoundException,
  UnauthorizedConnectionResponseException,
} from '../../../common/exceptions/connections.exceptions';
import { DeleteConnectionRequestDto } from '../../dto/delete-connection-request.dto';
import { ConnectionStatus } from '../../entities/connection.entity';
import { ConnectionRepository } from '../../repositories/connection.repository';

@Injectable()
export class DeleteConnectionRequestUseCase {
  constructor(private readonly connectionRepository: ConnectionRepository) {}

  async execute(
    currentUserId: number,
    deleteConnectionRequestDto: DeleteConnectionRequestDto,
  ): Promise<{ message: string }> {
    const { requestId } = deleteConnectionRequestDto;

    // Buscar la solicitud
    const connection = await this.connectionRepository.findById(requestId);

    if (!connection) {
      throw new ConnectionNotFoundException();
    }

    // Verificar que el usuario es el remitente o el destinatario
    if (
      connection.senderId !== currentUserId &&
      connection.receiverId !== currentUserId
    ) {
      throw new UnauthorizedConnectionResponseException();
    }

    // Determinar el tipo de acción según el estado de la solicitud
    let action = '';

    if (connection.status === ConnectionStatus.PENDING) {
      const isCancellation = connection.senderId === currentUserId;
      action = isCancellation ? 'canceled' : 'rejected';
    } else if (connection.status === ConnectionStatus.ACCEPTED) {
      action = 'removed';
    } else {
      throw new ConnectionAlreadyRespondedException();
    }

    // Eliminar físicamente la solicitud de conexión
    await this.connectionRepository.delete(requestId);

    return {
      message: `connection request ${action} successfully`,
    };
  }
}
