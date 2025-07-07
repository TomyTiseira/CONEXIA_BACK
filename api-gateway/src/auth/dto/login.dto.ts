import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'The email is not valid' })
  @IsNotEmpty({ message: 'The email is required' })
  email: string;

  @IsString({ message: 'The password must be a string' })
  @IsNotEmpty({ message: 'The password is required' })
  password: string;
}
