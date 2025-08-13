import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleNotFoundException } from 'src/common/exceptions/user.exceptions';
import { Repository } from 'typeorm';
import { Role } from '../../../shared/entities/role.entity';

@Injectable()
export class GetRoleByNameUseCase {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async execute(roleName: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { name: roleName, isActive: true },
    });

    if (!role) {
      throw new RoleNotFoundException(`Role with name '${roleName}' not found`);
    }

    return role;
  }
}
