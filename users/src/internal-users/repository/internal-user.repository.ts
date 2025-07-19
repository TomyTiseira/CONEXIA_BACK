import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleName } from 'src/common/constants/roles';
import { Role } from 'src/shared/entities/role.entity';
import { User } from 'src/shared/entities/user.entity';
import { UserRepository } from 'src/users/repository/users.repository';
import { In, Repository } from 'typeorm';

@Injectable()
export class InternalUserRepository extends UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super(userRepository);
  }

  async findRoleById(roleId: number) {
    return this.userRepository.manager.findOne(Role, {
      where: { id: roleId },
    });
  }

  async findRolesByNames(names: RoleName[]) {
    return this.userRepository.manager.find(Role, {
      where: { name: In(names) },
    });
  }
}
