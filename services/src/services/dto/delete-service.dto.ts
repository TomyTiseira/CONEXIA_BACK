import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeleteServiceDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'serviceId must be a number' },
  )
  @IsNotEmpty()
  serviceId: number;

  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty()
  reason: string;

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'userId must be a number' },
  )
  @IsNotEmpty()
  userId: number;
}
