import { IsNotEmpty, IsNumber } from 'class-validator';

export class DeleteInternalUserDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
