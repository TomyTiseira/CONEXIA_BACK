import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MembershipsService } from '../services/membreships.service';

@Controller()
export class DashboardController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @MessagePattern('getAdminMembershipMetrics')
  async getAdminMetrics() {
    return this.membershipsService.getAdminMetrics();
  }
}
