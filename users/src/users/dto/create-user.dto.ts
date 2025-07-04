import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';
import { MatchConstraint } from '../../validators/match.validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'email is not valid' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password: string;

  @IsString({ message: 'confirmPassword must be a string' })
  @IsNotEmpty({ message: 'confirmPassword is required' })
  @MinLength(6, {
    message: 'confirmPassword must be at least 6 characters long',
  })
  @Validate(MatchConstraint, ['password'], {
    message: 'passwords do not match',
  })
  confirmPassword: string;
}
