import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NatsModule } from 'src/transports/nats.module';
import { MockEmailService } from '../common/services/mock-email.service';
import { NodemailerService } from '../common/services/nodemailer.service';
import { UserBaseService } from '../common/services/user-base.service';
import { UsersController } from './controller/users.controller';
import { Role } from './entities/role.entity';
import { Users } from './entities/users.entity';
import { UserRepository } from './repository/users.repository';
import { CreateUserUseCase } from './service/use-cases/create-user.use-cases';
import { PingUseCase } from './service/use-cases/ping';
import { ResendVerificationUseCase } from './service/use-cases/resend-verification.use-cases';
import { VerifyUserUseCase } from './service/use-cases/verify-user.use-cases';
import { UsersService } from './service/users.service';

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    PingUseCase,
    CreateUserUseCase,
    VerifyUserUseCase,
    ResendVerificationUseCase,
    UserBaseService,
    UserRepository,
    {
      provide: MockEmailService,
      useClass: NodemailerService,
    },
  ],
  imports: [NatsModule, TypeOrmModule.forFeature([Users, Role])],
})
export class UsersModule {}
