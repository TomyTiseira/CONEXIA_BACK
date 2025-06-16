import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { UsersService } from '../service/users.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('ping')
  ping() {
    const response = this.usersService.ping();
    return {
      response,
    };
  }

  // @MessagePattern('createUser')
  // create(@Payload() createUserDto: CreateUserDto) {
  //   return this.usersService.create(createUserDto);
  // }

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
