import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;
}
