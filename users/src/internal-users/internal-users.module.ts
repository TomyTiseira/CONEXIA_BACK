import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserBaseService } from 'src/common/services/user-base.service';
import { Role } from 'src/shared/entities/role.entity';
import { User } from 'src/shared/entities/user.entity';
import { UsersModule } from '../users/users.module';
import { InternalUsersController } from './controller/internal-users.controller';
import { InternalUserRepository } from './repository/internal-user.repository';
import { InternalUsersService } from './service/internal-users.service';
import { CreateInternalUserUseCase } from './service/use-cases/create-internal-user.use-cases';
import { GetRolesByNamesUseCases } from './service/use-cases/get-roles-by-names.use-cases.dto';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([User, Role])],
  controllers: [InternalUsersController],
  providers: [
    InternalUsersService,
    CreateInternalUserUseCase,
    UserBaseService,
    InternalUserRepository,
    GetRolesByNamesUseCases,
  ],
})
export class InternalUsersModule {}
