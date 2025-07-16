import { Injectable } from '@nestjs/common';
import { User } from '../../shared/entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { CreateUserUseCase } from './use-cases/create-user.use-cases';
import { PingUseCase } from './use-cases/ping';
import { ResendVerificationUseCase } from './use-cases/resend-verification.use-cases';
import { VerifyUserUseCase } from './use-cases/verify-user.use-cases';

@Injectable()
export class UsersService {
  constructor(
    private readonly pingUseCase: PingUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly verifyUserUseCase: VerifyUserUseCase,
    private readonly resendVerificationUseCase: ResendVerificationUseCase,
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

  async deleteUser(reason: string): Promise<User> {
    return this.deleteUserUseCase.execute(reason);
  }

  // create(createUserDto: CreateUserDto) {
  //   return 'This action adds a new user';
  // }
  // findAll() {
  //   return `This action returns all users`;
  // }
  // findOne(id: number) {
  //   return `This action returns a #${id} user`;
  // }
  // update(id: number, updateUserDto: UpdateUserDto) {
  //   return `This action updates a #${id} user`;
  // }
  // remove(id: number) {
  //   return `This action removes a #${id} user`;
  // }
}
