import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import {
  InvalidCredentialsException,
  UserNotFoundException,
  UserNotVerifiedException,
} from 'src/common/exceptions/user.exceptions';
import { CryptoUtils } from '../../../common/utils/crypto.utils';
import { AccountStatus } from '../../../shared/entities/user.entity';
import { LoginDto } from '../../dto/login.dto';
import { LoginResponse } from '../../interfaces/auth.interface';
import { AuthRepository } from '../../repository/auth.repository';
import { TokenService } from '../token.service';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(loginData: LoginDto): Promise<LoginResponse> {
    // Buscar usuario por email
    const user = await this.authRepository.findByEmail(loginData.email);

    if (!user) {
      throw new UserNotFoundException(loginData.email);
    }

    // Verificar que el usuario esté validado
    if (!user.isValidate) {
      throw new UserNotVerifiedException();
    }

    // Verificar contraseña
    const isPasswordValid = await CryptoUtils.comparePassword(
      loginData.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    // Verificar estado de la cuenta
    // Solo bloqueamos login para usuarios BANEADOS (permanente)
    // Usuarios suspendidos SÍ pueden hacer login, pero no crear contenido
    if (user.accountStatus === AccountStatus.BANNED) {
      throw new RpcException({
        statusCode: 403,
        message: `Tu cuenta ha sido baneada permanentemente. Razón: ${user.banReason || 'Violación de las políticas de la plataforma'}. Si crees que esto es un error, contacta a soporte.`,
      });
    }

    // NO bloquear login para usuarios suspendidos
    // El ActiveAccountGuard en el API Gateway se encargará de bloquear
    // endpoints específicos de creación de contenido

    // Actualizar última actividad en login
    await this.authRepository.updateLastActivity(user.id);

    // Generar tokens usando el servicio especializado
    return this.tokenService.createLoginResponse(
      user.id,
      user.email,
      user.roleId,
      user.profileId,
      user.isProfileComplete,
      new Date(), // lastActivityAt actualizado
    );
  }
}
