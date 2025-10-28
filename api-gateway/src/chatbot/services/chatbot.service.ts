import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';
import { NATS_SERVICE } from '../../config';

@Injectable()
export class ChatbotService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async initializeChat(userId: number) {
    return firstValueFrom(
      this.client.send({ cmd: 'chatbot_initialize' }, userId).pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );
  }

  async sendMessage(userId: number, message: string) {
    return firstValueFrom(
      this.client
        .send({ cmd: 'chatbot_send_message' }, { userId, message })
        .pipe(
          catchError((error) => {
            throw new RpcException(error);
          }),
        ),
    );
  }

  async getConversations(userId: number) {
    return firstValueFrom(
      this.client.send({ cmd: 'chatbot_get_conversations' }, userId).pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );
  }

  async getMessages(conversationId: string) {
    return firstValueFrom(
      this.client.send({ cmd: 'chatbot_get_messages' }, conversationId).pipe(
        catchError((error) => {
          throw new RpcException(error);
        }),
      ),
    );
  }
}
