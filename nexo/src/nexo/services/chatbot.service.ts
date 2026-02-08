import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TOOLS_REGISTRY } from '../../config';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { OpenAIService } from './openai.service';
import { ToolsService } from './tools.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly openaiService: OpenAIService,
    @Inject(TOOLS_REGISTRY)
    private readonly toolsService: ToolsService,
  ) {}

  async shouldSendGreeting(userId: number): Promise<boolean> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const recentMessages = await this.messageRepository
      .createQueryBuilder('message')
      .innerJoin('message.conversation', 'conversation')
      .where('conversation.userId = :userId', { userId })
      .andWhere('message.createdAt > :sixHoursAgo', { sixHoursAgo })
      .getCount();

    return recentMessages === 0;
  }

  async getOrCreateActiveConversation(userId: number): Promise<Conversation> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    let conversation = await this.conversationRepository
      .createQueryBuilder('conversation')
      .where('conversation.userId = :userId', { userId })
      .andWhere(
        '(conversation.createdAt > :sixHoursAgo OR conversation.updatedAt > :sixHoursAgo)',
        { sixHoursAgo },
      )
      .orderBy('conversation.updatedAt', 'DESC')
      .getOne();

    if (!conversation) {
      conversation = this.conversationRepository.create({
        userId,
        createdAt: new Date(),
      });
      conversation = await this.conversationRepository.save(conversation);
      this.logger.log(`New conversation created for user ${userId}`);
    }

    return conversation;
  }

  async initializeChat(userId: number): Promise<{
    greeting?: string;
    conversationId: string;
    hasHistory: boolean;
  }> {
    const shouldGreet = await this.shouldSendGreeting(userId);

    if (shouldGreet) {
      const conversation = this.conversationRepository.create({
        userId,
        createdAt: new Date(),
      });
      const savedConversation =
        await this.conversationRepository.save(conversation);

      const greeting = await this.openaiService.generateGreeting();

      const assistantMsg = this.messageRepository.create({
        conversationId: savedConversation.id,
        content: greeting,
        role: 'assistant',
      });
      await this.messageRepository.save(assistantMsg);

      this.logger.log(
        `Greeting sent, conversation ${savedConversation.id} created`,
      );

      return {
        greeting,
        conversationId: savedConversation.id,
        hasHistory: false,
      };
    }

    const conversation = await this.getOrCreateActiveConversation(userId);

    return {
      conversationId: conversation.id,
      hasHistory: true,
    };
  }

  async sendMessage(
    userId: number,
    message: string,
  ): Promise<{ response: string; conversationId: string }> {
    const conversation = await this.getOrCreateActiveConversation(userId);

    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const recentMessages = await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', {
        conversationId: conversation.id,
      })
      .andWhere('message.createdAt > :sixHoursAgo', { sixHoursAgo })
      .orderBy('message.createdAt', 'ASC')
      .take(5)
      .getMany();

    const history = recentMessages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const tools = this.toolsService.getToolsSchema();

    this.logger.log(`Processing message: "${message.substring(0, 100)}..."`);
    this.logger.log(`Context: ${history.length} previous messages`);

    let finalResponse = '';
    const openaiResult = await this.openaiService.generateResponseWithTools(
      message,
      tools,
      history,
    );

    if (openaiResult.toolCalls && openaiResult.toolCalls.length > 0) {
      this.logger.log(
        `OpenAI decided to use ${openaiResult.toolCalls.length} tool(s):`,
      );
      this.logger.log(`Tools: ${JSON.stringify(openaiResult.toolCalls)}`);

      for (const toolCall of openaiResult.toolCalls) {
        try {
          this.logger.log(`Executing tool: ${toolCall.name} with parameters:`);
          this.logger.log(`Parameters: ${JSON.stringify(toolCall.arguments)}`);

          const result = await this.toolsService.executeTool(
            toolCall.name,
            toolCall.arguments,
          );

          this.logger.log(`Tool "${toolCall.name}" executed successfully`);

          if (toolCall.name === 'search_faqs' && Array.isArray(result)) {
            const faqs = result;
            this.logger.log(`Found ${faqs.length} relevant FAQs`);

            const context =
              faqs.length > 0
                ? faqs
                    .map((faq) => `P: ${faq.question}\nR: ${faq.answer}`)
                    .join('\n\n')
                : '';

            finalResponse = await this.openaiService.generateResponse(
              message,
              context,
              history,
            );
          }
        } catch (error) {
          this.logger.error(`Error executing tool ${toolCall.name}:`, error);
        }
      }
    } else {
      this.logger.log(`OpenAI decided to respond directly without using tools`);
      finalResponse = openaiResult.response;
    }

    const response = finalResponse || openaiResult.response;

    const userMsg = this.messageRepository.create({
      conversationId: conversation.id,
      content: message,
      role: 'user',
    });
    await this.messageRepository.save(userMsg);

    const assistantMsg = this.messageRepository.create({
      conversationId: conversation.id,
      content: response,
      role: 'assistant',
    });
    await this.messageRepository.save(assistantMsg);

    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    return {
      response,
      conversationId: conversation.id,
    };
  }

  async getConversations(userId: number): Promise<Conversation[]> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    return await this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.messages', 'messages')
      .where('conversation.userId = :userId', { userId })
      .andWhere('messages.createdAt > :sixHoursAgo', { sixHoursAgo })
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    return await this.messageRepository
      .createQueryBuilder('message')
      .where('message.conversationId = :conversationId', { conversationId })
      .andWhere('message.createdAt > :sixHoursAgo', { sixHoursAgo })
      .orderBy('message.createdAt', 'ASC')
      .getMany();
  }
}
