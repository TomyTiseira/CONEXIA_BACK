import { Module } from '@nestjs/common';
import { MembreshipsService } from './membreships.service';
import { MembreshipsController } from './membreships.controller';

@Module({
  controllers: [MembreshipsController],
  providers: [MembreshipsService],
})
export class MembreshipsModule {}
