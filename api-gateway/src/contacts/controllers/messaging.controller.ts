import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ROLES } from '../../auth/constants/role-ids';
import { AuthRoles } from '../../auth/decorators/auth-roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticatedRequest.interface';
import { MarkMessagesReadDto } from '../dto/mark-messages-read.dto';
import { InvalidFileTypeException } from '../exceptions/messaging.exceptions';
import { MessagingService } from '../services/messaging.service';

@Controller('messaging')
@AuthRoles([ROLES.USER])
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  @Post('send-message')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = file.mimetype.startsWith('image/')
            ? join(process.cwd(), 'uploads', 'messages', 'images')
            : join(process.cwd(), 'uploads', 'messages', 'pdfs');
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new InvalidFileTypeException(allowedTypes), false);
        }
      },
    }),
  )
  async sendMessage(
    @Body()
    body: {
      receiverId: number;
      type: 'text' | 'image' | 'pdf';
      content?: string;
    },
    @UploadedFile() file: Express.Multer.File,
    @User() user: AuthenticatedUser,
  ) {
    const messageData = {
      currentUserId: user.id,
      receiverId: body.receiverId,
      type: body.type,
      content:
        body.type === 'text'
          ? body.content
          : file
            ? `/uploads/messages/${file.mimetype.startsWith('image/') ? 'images' : 'pdfs'}/${file.filename}`
            : undefined,
      fileName: file?.originalname,
      fileSize: file?.size,
    };

    return this.messagingService.sendMessage(messageData);
  }

  @Get('conversations')
  async getConversations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @User() user: AuthenticatedUser,
  ) {
    return this.messagingService.getConversations(user.id, page, limit);
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @User() user: AuthenticatedUser,
  ) {
    return this.messagingService.getMessages(
      conversationId,
      user.id,
      page,
      limit,
    );
  }

  @Post('conversations/:conversationId/messages/read')
  async markMessagesAsRead(
    @Param('conversationId', ParseIntPipe) conversationId: number,
    @Body() markMessagesReadDto: MarkMessagesReadDto,
    @User() user: AuthenticatedUser,
  ) {
    return this.messagingService.markMessagesAsRead(
      conversationId,
      markMessagesReadDto.messageIds || [],
      user.id,
      markMessagesReadDto.otherUserId || 0,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@User() user: AuthenticatedUser) {
    return this.messagingService.getUnreadCount(user.id);
  }
}
