import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CreateInternalUserDto } from './dto/create-internal-user.dto';
import { InternalUsersService } from './internal-users.service';

@Controller('internal-users')
export class InternalUsersController {
  constructor(private readonly internalUsersService: InternalUsersService) {}

  @Get('roles')
  async getRoles() {
    return this.internalUsersService.getInternalRoles();
  }

  @Post()
  async createInternalUser(@Body() createUserDto: CreateInternalUserDto) {
    return this.internalUsersService.createInternalUser(createUserDto);
  }

  @MessagePattern('internal-users_create')
  async createInternalUserRpc(createUserDto: CreateInternalUserDto) {
    return this.internalUsersService.createInternalUser(createUserDto);
  }

  @MessagePattern('internal-users_get_roles')
  async getInternalRolesRpc() {
    return this.internalUsersService.getInternalRoles();
  }
}
