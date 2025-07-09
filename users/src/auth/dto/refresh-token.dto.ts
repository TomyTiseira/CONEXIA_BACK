import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString({ message: 'the refresh token must be a string' })
  @IsNotEmpty({ message: 'the refresh token is required' })
  refreshToken: string;
}
