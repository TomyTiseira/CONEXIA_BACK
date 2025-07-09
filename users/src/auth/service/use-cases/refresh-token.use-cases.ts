import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { RefreshTokenResponse } from '../../interfaces/auth.interface';
import { TokenService } from '../token.service';

@Injectable()
export class RefreshTokenUseCase {
  constructor(private readonly tokenService: TokenService) {}

  execute(refreshTokenDto: RefreshTokenDto): RefreshTokenResponse {
    try {
      // Verificar el refresh token
      const payload = this.tokenService.verifyToken(
        refreshTokenDto.refreshToken,
      );

      // Verificar que sea un refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      // Generar nuevo access token
      return this.tokenService.createRefreshResponse(
        payload.sub,
        payload.email,
        payload.roleId,
      );
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error during token refresh:', error);
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}
