import { Injectable } from '@nestjs/common';
import { User } from '../../shared/entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CreateUserUseCase } from './use-cases/create-user.use-cases';
import { GetRoleByIdUseCase } from './use-cases/get-role-by-id.use-cases';
import { PingUseCase } from './use-cases/ping';
import { ResendVerificationUseCase } from './use-cases/resend-verification.use-cases';
import { UpdateUserUseCase } from './use-cases/update-user.use-cases';
import { VerifyUserUseCase } from './use-cases/verify-user.use-cases';

@Injectable()
export class UsersService {
  constructor(
    private readonly pingUseCase: PingUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly verifyUserUseCase: VerifyUserUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
  ) {}

  ping() {
    return this.pingUseCase.execute();
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    return this.createUserUseCase.execute(userData);
  }

  async verifyUser(email: string, verificationCode: string): Promise<User> {
    return this.verifyUserUseCase.execute(email, verificationCode);
  }

  async resendVerification(email: string): Promise<User> {
    return this.resendVerificationUseCase.execute(email);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return this.updateUserUseCase.execute(id, updateUserDto);
  }

  async getRoleById(roleId: string) {
    return this.getRoleByIdUseCase.execute(roleId);
  }
}
