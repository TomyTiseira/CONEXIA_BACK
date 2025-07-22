import { Injectable } from '@nestjs/common';
import { RoleName, ROLES } from 'src/common/constants/roles';
import { GetInternalUsersDto } from '../dto/get-internal-users.dto';
import { CreateInternalUserUseCase } from './use-cases/create-internal-user.use-cases';
import { GetInternalUserUseCases } from './use-cases/get-internal-user.use-cases';
import { GetRolesByNamesUseCases } from './use-cases/get-roles-by-names.use-cases.dto';

interface CreateInternalUserDto {
  email: string;
  password: string;
  roleId: number;
}

@Injectable()
export class InternalUsersService {
  constructor(
    private readonly createInternalUserUseCase: CreateInternalUserUseCase,
    private readonly getRolesByNamesUseCases: GetRolesByNamesUseCases,
    private readonly getInternalUserUseCases: GetInternalUserUseCases,
  ) {}

  async createInternalUser(createUserDto: CreateInternalUserDto) {
    return this.createInternalUserUseCase.execute(createUserDto);
  }

  async getInternalRoles(): Promise<{ key: number; value: RoleName }[]> {
    const roles = await this.getRolesByNamesUseCases.execute([
      ROLES.ADMIN,
      ROLES.MODERATOR,
    ]);
    return roles.map((role) => ({
      key: role.id,
      value: role.name as RoleName,
    }));
  }

  async getInternalUsers(getInternalUsersDto: GetInternalUsersDto) {
    return this.getInternalUserUseCases.execute(getInternalUsersDto);
  }
}
