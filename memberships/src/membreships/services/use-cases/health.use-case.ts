import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthUseCase {
  execute(): string {
    return 'Memberships Service is healthy';
  }
}
