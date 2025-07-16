import { Body, Controller, Get, Post } from '@nestjs/common';
import { InternalUsersService } from './internal-users.service';

@Controller('internal-users')
export class InternalUsersController {
  constructor(private readonly internalUsersService: InternalUsersService) {}

  @Get('roles')
  async getRoles() {
    // Llama al microservicio para obtener los roles en formato key/value
    return this.internalUsersService.getInternalRoles();
  }

  @Post()
  async createInternalUser(@Body() createUserDto: any) {
    return this.internalUsersService.createInternalUser(createUserDto);
  }
}
