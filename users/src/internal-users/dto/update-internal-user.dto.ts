import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateInternalUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'userId must be a number' },
  )
  userId: number;

  @IsOptional()
  @IsString({ message: 'password must be a string' })
  password: string;

  @IsOptional()
  @IsInt({ message: 'roleId must be a number' })
  @IsNotEmpty({ message: 'roleId is required' })
  roleId: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: 'authenticatedUserId must be a number' },
  )
  authenticatedUserId: number;
}
