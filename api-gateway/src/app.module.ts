import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, AuthModule, InternalUsersModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
