import { Injectable } from '@nestjs/common';

@Injectable()
export class PingUseCase {
  execute(): string {
    return 'pong from memberships service';
  }
}

