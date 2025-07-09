import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthService } from '../service/auth.service';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern('login')
  async login(@Payload() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    };
  }

  @MessagePattern('refreshToken')
  refreshToken(@Payload() refreshTokenDto: RefreshTokenDto) {
    const result = this.authService.refreshToken(refreshTokenDto);

    return {
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
        expiresIn: result.expiresIn,
      },
    };
  }
}
