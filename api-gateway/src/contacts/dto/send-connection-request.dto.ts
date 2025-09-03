import { IsNumber } from 'class-validator';

export class SendConnectionRequestDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'receiverId must be a number' },
  )
  receiverId: number;
}
