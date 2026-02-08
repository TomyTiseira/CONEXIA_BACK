import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

export class MarkMessagesReadDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  messageIds: number[];
}
