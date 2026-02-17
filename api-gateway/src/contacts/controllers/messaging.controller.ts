import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ROLES } from '../../auth/constants/role-ids';
import { AuthRoles } from '../../auth/decorators/auth-roles.decorator';
import { User } from '../../auth/decorators/user.decorator';
import { FileStorage } from '../../common/domain/interfaces/file-storage.interface';
import { AuthenticatedUser } from '../../common/interfaces/authenticatedRequest.interface';
import { MarkMessagesReadDto } from '../dto/mark-messages-read.dto';
import { InvalidFileTypeException } from '../exceptions/messaging.exceptions';
import { MessagingService } from '../services/messaging.service';

@Controller('messaging')
@AuthRoles([ROLES.USER])
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    @Inject('MESSAGE_FILE_STORAGE')
    private readonly messageStorage: FileStorage,
  ) {}
memoryStorage(),
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
    let fileUrl: string | undefined;

    // Upload file to storage if present
    if (file) {
      const isImage = file.mimetype.startsWith('image/');
      const folder = isImage ? 'images' : 'pdfs';
      const uniqueSuffix =
        Date.now() + '-' + Math.round(Math.random() * 1e9);
      const filename = `${folder}/${uniqueSuffix}${extname(file.originalname)}`;

      fileUrl = await this.messageStorage.upload(
        file.buffer,
        filename,
        file.mimetype,
      );
    }

    const messageData = {
      currentUserId: user.id,
      receiverId: body.receiverId,
      type: body.type,
      content: body.type === 'text' ? body.content : fileUrltext'
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
    @User() user: AuthenticatedUser,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.messagingService.getConversations(user.id, page, limit, search);
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

  @Get('messages/:messageId/file')
  getMessageFile(
    @Param('messageId', ParseIntPipe) messageId: number,
    @User() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    return this.messagingService.getMessageFile(messageId, user.id, res);
  }
}
