import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ChatbotService } from './services/chatbot.service';

@Controller()
export class NexoController {
  constructor(private readonly chatbotService: ChatbotService) {}

  // Message patterns para chatbot
  @MessagePattern({ cmd: 'chatbot_initialize' })
  async initializeChat(@Payload() userId: number) {
    return await this.chatbotService.initializeChat(userId);
  }

  @MessagePattern({ cmd: 'chatbot_send_message' })
  async sendMessage(@Payload() data: { userId: number; message: string }) {
    return await this.chatbotService.sendMessage(data.userId, data.message);
  }

  @MessagePattern({ cmd: 'chatbot_get_conversations' })
  async getConversations(@Payload() userId: number) {
    return await this.chatbotService.getConversations(userId);
  }

  @MessagePattern({ cmd: 'chatbot_get_messages' })
  async getMessages(@Payload() conversationId: string) {
    return await this.chatbotService.getMessagesByConversation(conversationId);
  }
}
