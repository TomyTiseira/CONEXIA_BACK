import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from '../dto/create-user.dto';
import { DeleteUserDto } from '../dto/delete-user.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
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
      token: result.token,
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
}
