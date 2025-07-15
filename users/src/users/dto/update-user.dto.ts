import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsStrongPassword,
  Validate,
} from 'class-validator';
import { MatchConstraint } from '../../validators/match.validator';

export class UpdateUserDto {
  @IsNumber({}, { message: 'userId must be a number' })
  @IsNotEmpty({ message: 'userId is required' })
  userId: number;

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @IsStrongPassword({
    minLength: 12,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;

  @IsString({ message: 'confirmPassword must be a string' })
  @IsNotEmpty({ message: 'confirmPassword is required' })
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
        'confirmPassword must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  @Validate(MatchConstraint, ['password'], {
    message: 'passwords do not match',
  })
  confirmPassword: string;
}
