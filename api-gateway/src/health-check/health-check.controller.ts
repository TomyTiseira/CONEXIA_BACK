import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class HealthCheckController {
  @Get()
  checkHealth(): string {
    return 'API Gateway is healthy';
  }
}
