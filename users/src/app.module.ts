import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { envs } from './config';
import { DashboardModule } from './dashboard/dashboard.module';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { ModerationAction } from './moderation/entities/moderation-action.entity';
import { ModerationAnalysis } from './moderation/entities/moderation-analysis.entity';
import { ModerationModule } from './moderation/moderation.module';
import { PaymentAccountsModule } from './payment-accounts/payment-accounts.module';
import { Profile } from './profile/entities/profile.entity';
import { ProfileModule } from './profile/profile.module';
import { Bank } from './shared/entities/bank.entity';
import { DigitalPlatform } from './shared/entities/digital-platform.entity';
import { DocumentType } from './shared/entities/document-type.entity';
import { Locality } from './shared/entities/locality.entity';
import { PaymentAccount } from './shared/entities/payment-account.entity';
import { ProfileSkill } from './shared/entities/profile-skill.entity';
import { Role } from './shared/entities/role.entity';
import { UserReview } from './shared/entities/user-review.entity';
import { User } from './shared/entities/user.entity';
import { NatsModule } from './transports/nats.module';
import { UserReviewReport } from './user-review-report/entities/user-review-report.entity';
import { UserReviewReportModule } from './user-review-report/user-review-report.module';
import { UserReviewsModule } from './user-reviews/user-reviews.module';
import { UsersModule } from './users/users.module';
import { UserVerification } from './verification/entities/user-verification.entity';
import { VerificationModule } from './verification/verification.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.dbHost,
      port: parseInt(envs.dbPort),
      username: envs.dbUsername,
      password: envs.dbPassword,
      database: envs.dbDatabase,
      entities: [
        User,
        UserReview,
        UserReviewReport,
        Role,
        DocumentType,
        Profile,
        ProfileSkill,
        Locality,
        PaymentAccount,
        Bank,
        DigitalPlatform,
        UserVerification,
        ModerationAnalysis,
        ModerationAction,
      ],
      synchronize: true,
    }),
    UsersModule,
    UserReviewsModule,
    UserReviewReportModule,
    AuthModule,
    NatsModule,
    ProfileModule,
    InternalUsersModule,
    PaymentAccountsModule,
    VerificationModule,
    ModerationModule,
    DashboardModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
