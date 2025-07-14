import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from '../dto/create-user.dto';
import { ResendVerificationDto } from '../dto/resend-verification.dto';
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
    console.log(1);
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

  // @MessagePattern('findAllUsers')
  // findAll() {
  //   return this.usersService.findAll();
  // }

  // @MessagePattern('findOneUser')
  // findOne(@Payload() id: number) {
  //   return this.usersService.findOne(id);
  // }

  // @MessagePattern('updateUser')
  // update(@Payload() updateUserDto: UpdateUserDto) {
  //   return this.usersService.update(updateUserDto.id, updateUserDto);
  // }

  // @MessagePattern('removeUser')
  // remove(@Payload() id: number) {
  //   return this.usersService.remove(id);
  // }
}
