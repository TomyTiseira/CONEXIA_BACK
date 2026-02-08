import { IsArray, IsNumber, IsOptional } from 'class-validator';

export class MarkMessagesReadDto {
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  messageIds?: number[];

  @IsOptional()
  @IsNumber()
  otherUserId?: number;
}
