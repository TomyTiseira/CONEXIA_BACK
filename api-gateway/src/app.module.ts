import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ContactsModule } from './contacts/contacts.module';
import { MessagingModule } from './contacts/messaging.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { MembershipsModule } from './memberships/memberships.module';
import { ModerationModule } from './moderation/moderation.module';
import { PaymentAccountsModule } from './payment-accounts/payment-accounts.module';

import { PostulationsModule } from './postulations/postulations.module';
import { ProjectsModule } from './projects/projects.module';
import { PublicationReportsModule } from './publication-reports/publication-reports.module';
import { PublicationsModule } from './publications/publications.module';
import { ReportsModule } from './reports/reports.module';
import { ServiceHiringsModule } from './service-hirings/service-hirings.module';
import { ServiceReviewReportsModule } from './service-review-reports/service-review-reports.module';
import { ServiceReviewsModule } from './service-reviews/service-reviews.module';
import { ServicesModule } from './services/services.module';
import { UserReviewsModule } from './user-reviews/user-reviews.module';
import { UsersModule } from './users/users.module';
import { VerificationModule } from './verification/verification.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    UsersModule,
    UserReviewsModule,
    AuthModule,
    ChatbotModule,
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
    ServiceReviewsModule,
    ServiceReviewReportsModule,
    VerificationModule,
    WebhooksModule,
    ModerationModule,
    MembershipsModule,
    DashboardModule,
    WebSocketModule, // Módulo para notificaciones en tiempo real
  ],
  controllers: [],
})
export class AppModule {}
