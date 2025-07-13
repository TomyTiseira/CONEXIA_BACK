import { Injectable } from '@nestjs/common';
import { UserBaseService } from '../../../common/services/user-base.service';
import { UserRepository } from '../../../users/repository/users.repository';
import { VerifyCodeResetDto } from '../../dto/verify-code-reset.dto';
import { TokenService } from '../token.service';

@Injectable()
export class VerifyCodeResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBaseService: UserBaseService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    verifyCodeResetDto: VerifyCodeResetDto,
  ): Promise<{ token: string }> {
    const user = await this.userBaseService.validateUserExists(
      verifyCodeResetDto.email,
    );

    // Validar que el usuario esté activo
    this.userBaseService.validateUserActive(user);

    // Validar el código de verificación
    this.userBaseService.validatePasswordResetCode(
      user,
      verifyCodeResetDto.verificationCode,
    );

    // Validar que el código no haya expirado
    this.userBaseService.validatePasswordResetCodeNotExpired(user);

    // Actualizar usuario - limpiar los campos de reset
    await this.userRepository.clearPasswordResetFields(user.id);

    // Generar token de recuperación de contraseña
    const token = this.tokenService.generatePasswordResetToken(
      user.id,
      user.email,
    );

    return {
      token,
    };
  }
}
