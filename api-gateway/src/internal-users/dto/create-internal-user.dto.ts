import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
} from 'class-validator';

export class CreateInternalUserDto {
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @IsStrongPassword(
    {
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  password: string;

  @IsInt({ message: 'roleId must be a number' })
  @IsNotEmpty({ message: 'roleId is required' })
  roleId: number;
}
