import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatsModule } from 'src/transports/nats.module';
import { UsersController } from './controller/users.controller';
import { Users } from './entities/users.entity';
import { UserRepository } from './repository/users.repository';
import { PingUseCase } from './service/use-cases/ping';
import { UsersService } from './service/users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PingUseCase, UserRepository],
  imports: [NatsModule, TypeOrmModule.forFeature([Users])],
})
export class UsersModule {}
