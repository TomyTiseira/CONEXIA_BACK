import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ROLES } from 'src/auth/constants/role-ids';
import { AuthRoles } from '../auth/decorators/auth-roles.decorator';
import { User } from '../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../common/interfaces/authenticatedRequest.interface';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatbotService } from './services/chatbot.service';

@Controller('chatbot')
@AuthRoles([ROLES.ADMIN, ROLES.MODERATOR, ROLES.USER])
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Get('initialize')
  async initializeChat(@User() user: AuthenticatedUser) {
    return this.chatbotService.initializeChat(user.id);
  }

  @Post('message')
  async sendMessage(
    @Body() sendMessageDto: SendMessageDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.chatbotService.sendMessage(user.id, sendMessageDto.message);
  }

  @Get('conversations')
  async getConversations(@User() user: AuthenticatedUser) {
    return this.chatbotService.getConversations(user.id);
  }

  @Get('messages/:conversationId')
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatbotService.getMessages(conversationId);
  }
}
