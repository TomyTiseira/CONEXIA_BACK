import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenDto } from '../../dto/refresh-token.dto';
import { RefreshTokenResponse } from '../../interfaces/auth.interface';
import { TokenService } from '../token.service';
import { UserRepository } from '../../../users/repository/users.repository';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
  ) {}

  async execute(refreshTokenDto: RefreshTokenDto): Promise<RefreshTokenResponse> {
    try {
      // Verificar el refresh token
      const payload = this.tokenService.verifyToken(
        refreshTokenDto.refreshToken,
      );

      // Verificar que sea un refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Token inválido');
      }

      // Tomar el estado actual desde DB (profileId/isProfileComplete pueden cambiar)
      const user = await this.userRepository.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado');
      }

      // Generar nuevo access token
      return this.tokenService.createRefreshResponse(
        user.id,
        user.email,
        user.roleId,
        user.profileId,
        user.isProfileComplete,
      );
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error during token refresh:', error);
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
  }
}
