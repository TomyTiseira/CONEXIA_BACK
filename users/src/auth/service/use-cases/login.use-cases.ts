import { Injectable } from '@nestjs/common';
import {
  InvalidCredentialsException,
  UserNotFoundException,
  UserNotVerifiedException,
} from 'src/common/exceptions/user.exceptions';
import { CryptoUtils } from '../../../common/utils/crypto.utils';
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
