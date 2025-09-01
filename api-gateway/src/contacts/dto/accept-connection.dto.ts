import { IsNumber } from 'class-validator';

export class AcceptConnectionDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'requestId must be a number' },
  )
  requestId: number;
}
