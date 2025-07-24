import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateInternalUserDto {
  @IsOptional()
  @IsString({ message: 'password must be a string' })
  password: string;

  @IsOptional()
  @IsInt({ message: 'roleId must be a number' })
  @IsNotEmpty({ message: 'roleId is required' })
  roleId: number;
}
