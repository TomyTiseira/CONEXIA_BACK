import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config/service';

@Injectable()
export class InternalUsersService {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

  async createInternalUser(createUserDto: any) {
    return this.client.send('internal-users_create', createUserDto).toPromise();
  }

  async getInternalRoles() {
    return this.client.send('internal-users_get_roles', {}).toPromise();
  }
}
