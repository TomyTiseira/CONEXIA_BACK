import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'receiverId must be a number' },
  )
  @IsPositive({ message: 'receiverId must be a positive number' })
  @IsNotEmpty({ message: 'receiverId is required' })
  receiverId: number;

  @IsEnum(MessageType)
  @IsNotEmpty({ message: 'type is required' })
  type: MessageType;

  @IsString({ message: 'content must be a string' })
  @IsNotEmpty({ message: 'content is required' })
  content: string;

  @IsString({ message: 'fileName must be a string' })
  @IsOptional({ message: 'fileName is optional' })
  fileName?: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'fileSize must be a number' },
  )
  @IsPositive({ message: 'fileSize must be a positive number' })
  @IsOptional({ message: 'fileSize is optional' })
  fileSize?: number;
}
