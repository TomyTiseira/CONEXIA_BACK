import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class GetMessagesDto {
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  conversationId: number;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  @IsOptional()
  page?: number = 1;

  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @IsPositive()
  @IsOptional()
  limit?: number = 20;
}
