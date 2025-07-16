import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteUserDto {
  
  @IsString({ message: 'reason must be a string' })
  @IsNotEmpty()
  reason: string;
}
