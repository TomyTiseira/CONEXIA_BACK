import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class SendConnectionDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'receiverId must be a number' },
  )
  receiverId: number;

  @IsOptional()
  @IsString({ message: 'message must be a string' })
  @MinLength(1, { message: 'message must be at least 1 character long' })
  message?: string;
}
