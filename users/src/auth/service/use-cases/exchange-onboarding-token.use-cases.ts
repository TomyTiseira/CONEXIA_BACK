import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from '../../../users/repository/users.repository';
import { AuthRepository } from '../../repository/auth.repository';
import { TokenService } from '../token.service';

@Injectable()
export class ExchangeOnboardingTokenUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
    private readonly authRepository: AuthRepository,
  ) {}

  async execute(onboardingToken: string) {
    let payload: any;
    try {
      payload = this.tokenService.verifyToken(onboardingToken);
    } catch {
      throw new UnauthorizedException('Onboarding token inválido o expirado');
    }

    if (payload?.type !== 'onboarding') {
      throw new UnauthorizedException('Token inválido');
    }

    const userId = Number(payload.sub);
    if (!userId || Number.isNaN(userId)) {
      throw new UnauthorizedException('Token inválido');
    }

    const user = await this.userRepository.findByIdWithRelations(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    if (!user.isValidate) {
      throw new UnauthorizedException('Usuario no verificado');
    }

    if (user.isProfileComplete !== true && user.isProfileComplete !== null) {
      throw new RpcException({
        statusCode: 409,
        code: 'PROFILE_INCOMPLETE',
        message: 'El perfil todavía no está completo',
      });
    }

    await this.authRepository.updateLastActivity(user.id);

    return this.tokenService.createLoginResponse(
      user.id,
      user.email,
      user.roleId,
      user.profileId,
      user.isProfileComplete,
      new Date(),
    );
  }
}
