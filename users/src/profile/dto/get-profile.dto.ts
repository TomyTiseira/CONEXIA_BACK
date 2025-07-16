import { IsNumber, IsObject, IsString } from 'class-validator';

class AuthenticatedUserDto {
  @IsNumber({}, { message: 'id must be a number' })
  id: number;

  @IsString({ message: 'email must be a string' })
  email: string;

  @IsNumber({}, { message: 'roleId must be a number' })
  roleId: number;
}

export class GetProfileDto {
  @IsNumber({}, { message: 'targetUserId must be a number' })
  targetUserId: number;

  @IsObject({ message: 'authenticatedUser must be an object' })
  authenticatedUser: AuthenticatedUserDto;
}
