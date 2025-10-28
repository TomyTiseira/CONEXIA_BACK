import { IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: 'the message must be a string' })
  @IsNotEmpty({ message: 'the message is required' })
  message: string;
}
