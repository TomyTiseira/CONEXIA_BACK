import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ContactsModule } from './contacts/contacts.module';
import { MessagingModule } from './contacts/messaging.module';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { PaymentAccountsModule } from './payment-accounts/payment-accounts.module';

import { PostulationsModule } from './postulations/postulations.module';
import { ProjectsModule } from './projects/projects.module';
import { PublicationReportsModule } from './publication-reports/publication-reports.module';
import { PublicationsModule } from './publications/publications.module';
import { ReportsModule } from './reports/reports.module';
import { ServiceHiringsModule } from './service-hirings/service-hirings.module';
import { ServicesModule } from './services/services.module';
import { UsersModule } from './users/users.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    InternalUsersModule,
    PaymentAccountsModule,
    ProjectsModule,
    PostulationsModule,
    ReportsModule,
    PublicationsModule,
    ContactsModule,
    MessagingModule,
    PublicationReportsModule,
    ServicesModule,
    ServiceHiringsModule,
    WebhooksModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
