import { Injectable } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import {
  LoginResponse,
  RefreshTokenResponse,
} from '../interfaces/auth.interface';
import { LoginUseCase } from './use-cases/login.use-cases';
import { RefreshTokenUseCase } from './use-cases/refresh-token.use-cases';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  async login(loginData: LoginDto): Promise<LoginResponse> {
    return this.loginUseCase.execute(loginData);
  }

  refreshToken(refreshTokenDto: RefreshTokenDto): RefreshTokenResponse {
    return this.refreshTokenUseCase.execute(refreshTokenDto);
  }
}
