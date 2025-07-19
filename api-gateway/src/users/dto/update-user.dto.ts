import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Validate,
} from 'class-validator';
import { MatchConstraint } from '../../validators/match.validator';

export class UpdateUserDto {
  @IsString({ message: 'actualPassword must be a string' })
  @IsNotEmpty({ message: 'actualPassword is required' })
  actualPassword: string;

  @IsString({ message: 'newPassword must be a string' })
  @IsNotEmpty({ message: 'newPassword is required' })
  @IsStrongPassword({
    minLength: 12,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  newPassword: string;

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
  @Validate(MatchConstraint, ['newPassword'], {
    message: 'passwords do not match',
  })
  confirmPassword: string;
}
