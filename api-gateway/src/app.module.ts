import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { MessagingModule } from './contacts/messaging.module';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { PostulationsModule } from './postulations/postulations.module';
import { ProjectsModule } from './projects/projects.module';
import { PublicationReportsModule } from './publication-reports/publication-reports.module';
import { PublicationsModule } from './publications/publications.module';
import { ReportsModule } from './reports/reports.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    InternalUsersModule,
    ProjectsModule,
    PostulationsModule,
    ReportsModule,
    PublicationsModule,
    ContactsModule,
    MessagingModule,
    PublicationReportsModule,
    ServicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
