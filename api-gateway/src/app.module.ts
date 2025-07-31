import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { ProjectsModule } from './projects/projects.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [UsersModule, AuthModule, InternalUsersModule, ProjectsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
