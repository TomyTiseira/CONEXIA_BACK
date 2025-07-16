import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DeleteUserDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'user id must be a number' },
  )
  @IsNotEmpty()
  userId: number;

  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty()
  reason: string;
}
