import { Injectable } from '@nestjs/common';
import {
  MissingRequiredFieldsException,
  RoleIdInvalidException,
  RoleNotFoundException,
} from '../../../common/exceptions/user.exceptions';
import { UserRepository } from '../../repository/users.repository';

@Injectable()
export class GetRoleByIdUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(roleId: string): Promise<{ id: number; name: string }> {
    if (!roleId) {
      throw new MissingRequiredFieldsException(['Role ID']);
    }

    const idParsed = parseInt(roleId, 10);

    if (isNaN(idParsed) || idParsed <= 0) {
      throw new RoleIdInvalidException();
    }

    const role = await this.userRepository.findRoleById(idParsed);

    if (!role) {
      throw new RoleNotFoundException(`Role with ID ${roleId} not found`);
    }

    return {
      id: role.id,
      name: role.name,
    };
  }
}
