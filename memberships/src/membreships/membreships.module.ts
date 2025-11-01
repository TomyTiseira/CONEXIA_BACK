import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembreshipsController } from './controller/membreships.controller';
import { Membreship } from './entities/membreship.entity';
import { MembreshipRepository } from './repository/membreship.repository';
import { MembreshipsService } from './service/membreships.service';
import { PingUseCase } from './service/use-cases/ping.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Membreship])],
  controllers: [MembreshipsController],
  providers: [MembreshipsService, MembreshipRepository, PingUseCase],
  exports: [MembreshipRepository, MembreshipsService],
})
export class MembreshipsModule {}
