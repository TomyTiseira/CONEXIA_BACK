import { Injectable } from '@nestjs/common';
import { Locality } from '../../shared/entities/locality.entity';
import { User } from '../../shared/entities/user.entity';
import { LocalityRepository } from '../../shared/repository/locality.repository';
import { SkillsValidationService } from '../../shared/services/skills-validation.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserRepository } from '../repository/users.repository';
import { CreateUserUseCase } from './use-cases/create-user.use-cases';
import { DeleteUserUseCase } from './use-cases/delate-user.use-cases';
import { FindUserByIdUseCase } from './use-cases/find-user-by-id.use-cases';
import { FindUsersByIdsUseCase } from './use-cases/find-users-by-ids.use-cases';
import { GetRoleByIdUseCase } from './use-cases/get-role-by-id.use-cases';
import { GetRoleByNameUseCase } from './use-cases/get-role-by-name.use-cases';
import { GetUserWithProfileAndSkillsUseCase } from './use-cases/get-user-with-profile-and-skills.use-cases';
import { GetUserWithProfileUseCase } from './use-cases/get-user-with-profile.use-cases';
import { GetUsersSkillsOnlyUseCase } from './use-cases/get-users-skills-only.use-case';
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
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly getRoleByIdUseCase: GetRoleByIdUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly getUserWithProfileUseCase: GetUserWithProfileUseCase,
    private readonly getUserWithProfileAndSkillsUseCase: GetUserWithProfileAndSkillsUseCase,
    private readonly getUsersSkillsOnlyUseCase: GetUsersSkillsOnlyUseCase,
    private readonly localityRepository: LocalityRepository,
    private readonly findUsersByIdsUseCase: FindUsersByIdsUseCase,
    private readonly getRoleByNameUseCase: GetRoleByNameUseCase,
    private readonly userRepository: UserRepository,
    private readonly skillsValidationService: SkillsValidationService,
  ) {}

  ping() {
    return this.pingUseCase.execute();
  }

  async createUser(userData: CreateUserDto): Promise<User> {
    return this.createUserUseCase.execute(userData);
  }

  async verifyUser(
    email: string,
    verificationCode: string,
  ): Promise<{
    user: User;
    data: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    return this.verifyUserUseCase.execute(email, verificationCode);
  }

  async resendVerification(email: string): Promise<User> {
    return this.resendVerificationUseCase.execute(email);
  }

  async deleteUser(userId: number, reason: string): Promise<User> {
    return this.deleteUserUseCase.execute(userId, reason);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    return this.updateUserUseCase.execute(id, updateUserDto);
  }

  async getRoleById(roleId: string) {
    return this.getRoleByIdUseCase.execute(roleId);
  }

  async getRoleByName(roleName: string) {
    return this.getRoleByNameUseCase.execute(roleName);
  }

  async findUserById(userId: number): Promise<User | null> {
    return this.findUserByIdUseCase.execute(userId);
  }

  async getLocalities(): Promise<Locality[]> {
    return this.localityRepository.findAll();
  }

  async validateLocalityExists(localityId: number): Promise<boolean> {
    const locality = await this.localityRepository.findById(localityId);
    return locality !== null;
  }

  async findUsersByIds(userIds: number[]): Promise<User[]> {
    return this.findUsersByIdsUseCase.execute(userIds);
  }

  async getLocalityById(localityId: number): Promise<Locality | null> {
    return this.localityRepository.findById(localityId);
  }

  async getUserWithProfile(
    userId: number,
  ): Promise<{ user: User; profile: any } | null> {
    return this.getUserWithProfileUseCase.execute(userId);
  }

  async getUserWithProfileAndSkills(
    userId: number,
  ): Promise<{ user: User; profile: any } | null> {
    return await this.getUserWithProfileAndSkillsUseCase.execute(userId);
  }

  findSkillsByIds(skillIds: number[]): Promise<any[]> {
    return this.skillsValidationService.getSkillsByIds(skillIds);
  }

  async getAllUsersExcept(
    currentUserId: number,
    excludedIds: number[],
    limit: number,
  ): Promise<number[]> {
    return await this.userRepository.getAllUsersExcept(
      currentUserId,
      excludedIds,
      limit,
    );
  }

  // Método optimizado para obtener solo skills sin cargar perfiles completos
  async getUsersSkillsOnly(
    userIds: number[],
  ): Promise<Array<{ userId: number; skillIds: number[] }>> {
    return await this.getUsersSkillsOnlyUseCase.execute(userIds);
  }
}
