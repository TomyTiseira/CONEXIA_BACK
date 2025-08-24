import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { PostulationsModule } from './postulations/postulations.module';
import { ProjectsModule } from './projects/projects.module';
import { ReportsModule } from './reports/reports.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    InternalUsersModule,
    ProjectsModule,
    PostulationsModule,
    ReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
