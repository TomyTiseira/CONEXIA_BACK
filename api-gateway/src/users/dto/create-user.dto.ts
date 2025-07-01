import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;

  @IsNumber({}, { message: 'roleId must be a number' })
  @IsPositive({ message: 'roleId must be a positive number' })
  @IsNotEmpty({ message: 'roleId is required' })
  roleId: number;
}
