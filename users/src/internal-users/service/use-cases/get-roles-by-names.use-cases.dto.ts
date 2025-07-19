import { Injectable } from '@nestjs/common';
import { RoleName } from 'src/common/constants/roles';

import { InternalUserRepository } from '../../repository/internal-user.repository';

@Injectable()
export class GetRolesByNamesUseCases {
  constructor(private readonly userRepository: InternalUserRepository) {}

  async execute(names: RoleName[]) {
    return this.userRepository.findRolesByNames(names);
  }
}
