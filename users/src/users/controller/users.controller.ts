import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from '../dto/create-user.dto';
import { DeleteUserDto } from '../dto/delete-user.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
import { SearchUsersDto } from '../dto/search-users.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { VerifyUserDto } from '../dto/verify-user.dto';
import { UsersService } from '../service/users.service';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('ping')
  ping() {
    return this.usersService.ping();
  }

  @MessagePattern('createUser')
  async create(@Payload() createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);
    return {
      id: user.id,
      email: user.email,
      isValidate: user.isValidate,
      message:
        'User created successfully. Please check your email for verification code.',
    };
  }

  @MessagePattern('verifyUser')
  async verify(@Payload() verifyUserDto: VerifyUserDto) {
    const result = await this.usersService.verifyUser(
      verifyUserDto.email,
      verifyUserDto.verificationCode,
    );
    return {
      id: result.user.id,
      email: result.user.email,
      isValidate: result.user.isValidate,
      message: 'User verified successfully.',
      data: result.data,
    };
  }

  @MessagePattern('resendVerification')
  async resendVerification(
    @Payload() resendVerificationDto: ResendVerificationDto,
  ) {
    const user = await this.usersService.resendVerification(
      resendVerificationDto.email,
    );
    return {
      id: user.id,
      email: user.email,
      isValidate: user.isValidate,
      message: 'Verification code sent successfully.',
    };
  }

  @MessagePattern('deleteUser')
  async delete(@Payload() deleteUserDto: DeleteUserDto) {
    const user = await this.usersService.deleteUser(
      deleteUserDto.userId,
      deleteUserDto.reason,
    );
    return {
      id: user.id,
      email: user.email,
      message: 'User deleted successfully.',
    };
  }

  @MessagePattern('updateUser')
  async update(@Payload() updateUserDto: UpdateUserDto) {
    const user = await this.usersService.update(
      updateUserDto.userId,
      updateUserDto,
    );
    return {
      id: user.id,
      email: user.email,
      isValidate: user.isValidate,
      message: 'User updated successfully.',
    };
  }

  @MessagePattern('getRoleById')
  async getRoleById(@Payload() id: string) {
    const role = await this.usersService.getRoleById(id);
    return {
      id: role.id,
      name: role.name,
      message: 'Role retrieved successfully.',
    };
  }

  @MessagePattern('getRoleByName')
  async getRoleByName(@Payload() name: string) {
    const role = await this.usersService.getRoleByName(name);
    return {
      id: role.id,
      name: role.name,
      message: 'Role retrieved successfully.',
    };
  }

  @MessagePattern('findUserById')
  async findUserById(@Payload() data: { id: number }) {
    const user = await this.usersService.findUserById(data.id);
    return user;
  }

  @MessagePattern('findUserByIdIncludingDeleted')
  async findUserByIdIncludingDeleted(@Payload() data: { id: number }) {
    const user = await this.usersService.findUserByIdIncludingDeleted(data.id);
    return user;
  }

  @MessagePattern('findUserByIdWithRelations')
  async findUserByIdWithRelations(@Payload() data: { id: number }) {
    const user = await this.usersService.findUserByIdWithRelations(data.id);
    return user;
  }

  @MessagePattern('getLocalities')
  async getLocalities() {
    return await this.usersService.getLocalities();
  }

  @MessagePattern('validateLocalityExists')
  async validateLocalityExists(@Payload() data: { id: number }) {
    return await this.usersService.validateLocalityExists(data.id);
  }

  @MessagePattern('findUsersByIds')
  async findUsersByIds(@Payload() data: { ids: number[] }) {
    const users = await this.usersService.findUsersByIds(data.ids);
    return users;
  }

  @MessagePattern('getLocalityById')
  async getLocalityById(@Payload() data: { id: number }) {
    const locality = await this.usersService.getLocalityById(data.id);
    return locality;
  }

  @MessagePattern('getUserWithProfile')
  async getUserWithProfile(@Payload() data: { userId: number }) {
    const result = await this.usersService.getUserWithProfile(data.userId);
    return result;
  }

  @MessagePattern('searchUsers')
  async searchUsers(
    @Payload() data: { searchTerm: string; excludeUserId?: number },
  ) {
    const users = await this.usersService.searchUsers(
      data.searchTerm,
      data.excludeUserId,
    );
    return users;
  }

  @MessagePattern('searchUsersPaginated')
  async searchUsersPaginated(@Payload() searchParams: SearchUsersDto) {
    const result = await this.usersService.searchUsersPaginated(searchParams);
    return {
      data: result.users,
      pagination: result.pagination,
    };
  }

  @MessagePattern('getUsers')
  async getUsers(@Payload() searchParams: SearchUsersDto) {
    const result = await this.usersService.searchUsersPaginated(searchParams);
    return result;
  }

  @MessagePattern('getTotalGeneralUsers')
  async getTotalGeneralUsers() {
    const count = await this.usersService.getTotalGeneralUsers();
    return count;
  }

  /**
   * Verifica el estado de la cuenta de un usuario (baneado/suspendido)
   * Usado por el API Gateway en cada request para validar acceso
   */
  @MessagePattern('checkUserAccountStatus')
  async checkUserAccountStatus(@Payload() data: { userId: number }) {
    const status = await this.usersService.checkUserAccountStatus(data.userId);
    return status;
  }
}
