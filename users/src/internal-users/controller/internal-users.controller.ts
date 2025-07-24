import { Body, Controller, Get, Post } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateInternalUserDto } from '../dto/create-internal-user.dto';
import { DeleteInternalUserDto } from '../dto/delete-internal-user.dto';
import { GetInternalUsersDto } from '../dto/get-internal-users.dto';
import { UpdateInternalUserDto } from '../dto/update-internal-user.dto';
import { InternalUsersService } from '../service/internal-users.service';

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

  @MessagePattern('internal-users_get_all')
  async getInternalUsersRpc(
    @Payload() getInternalUsersDto: GetInternalUsersDto,
  ) {
    return this.internalUsersService.getInternalUsers(getInternalUsersDto);
  }

  @MessagePattern('internal-users_delete')
  async deleteInternalUserRpc(
    @Payload() deleteInternalUserDto: DeleteInternalUserDto,
  ) {
    return this.internalUsersService.deleteInternalUser(deleteInternalUserDto);
  }

  @MessagePattern('internal-users_update')
  async updateInternalUserRpc(
    @Payload() updateInternalUserDto: UpdateInternalUserDto,
  ) {
    return this.internalUsersService.updateInternalUser(updateInternalUserDto);
  }
}
