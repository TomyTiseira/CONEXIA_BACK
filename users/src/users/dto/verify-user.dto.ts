import { IsEmail, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class VerifyUserDto {
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsNumberString({}, { message: 'verificationCode must be a numeric string' })
  @IsNotEmpty({ message: 'verificationCode is required' })
  @Length(6, 6, {
    message: 'verificationCode must be exactly 6 characters long',
  })
  verificationCode: string;
}
