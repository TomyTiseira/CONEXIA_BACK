import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TOOLS_REGISTRY } from '../config';
import { Conversation } from './entities/conversation.entity';
import { FaqEmbedding } from './entities/faq-embedding.entity';
import { Message } from './entities/message.entity';
import { Nexo } from './entities/nexo.entity';
import { NexoController } from './nexo.controller';
import { NexoService } from './nexo.service';
import { ChatbotService } from './services/chatbot.service';
import { OpenAIService } from './services/openai.service';
import { ToolsService } from './services/tools.service';
import { AnswerHubTool } from './tools/answer-hub.tool';

@Module({
  imports: [
    TypeOrmModule.forFeature([Nexo, FaqEmbedding, Conversation, Message]),
  ],
  controllers: [NexoController],
  providers: [
    NexoService,
    ChatbotService,
    OpenAIService,
    ToolsService,
    AnswerHubTool,
    {
      provide: TOOLS_REGISTRY,
      useFactory: (
        toolsService: ToolsService,
        answerHubTool: AnswerHubTool,
      ) => {
        // Registrar todas las herramientas disponibles
        toolsService.registerTool(answerHubTool);
        // Aquí se pueden agregar más herramientas en el futuro
        return toolsService;
      },
      inject: [ToolsService, AnswerHubTool],
    },
  ],
  exports: [NexoService, ChatbotService],
})
export class NexoModule {}
