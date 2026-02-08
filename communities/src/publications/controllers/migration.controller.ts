import { Injectable } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MigrateLegacyMediaService } from '../services/migrate-legacy-media.service';

@Injectable()
export class MigrationController {
  constructor(
    private readonly migrateLegacyMediaService: MigrateLegacyMediaService,
  ) {}

  @MessagePattern('migrateLegacyMedia')
  async migrateLegacyMedia(): Promise<{ message: string }> {
    await this.migrateLegacyMediaService.migrateLegacyMedia();
    return { message: 'Legacy media migration completed successfully' };
  }

  @MessagePattern('cleanupLegacyFields')
  async cleanupLegacyFields(): Promise<{ message: string }> {
    await this.migrateLegacyMediaService.cleanupLegacyFields();
    return { message: 'Legacy fields cleanup completed successfully' };
  }
}
