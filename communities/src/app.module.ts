import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common/common.module';
import { envs } from './config';
import { ContactsModule } from './contacts/contacts.module';
import { Connection } from './contacts/entities/connection.entity';
import { Conversation } from './contacts/entities/conversation.entity';
import { Message } from './contacts/entities/message.entity';
import { PublicationReport } from './publication-reports/entities/publication-report.entity';
import { PublicationReportsModule } from './publication-reports/publication-reports.module';
import { PublicationComment } from './publications/entities/publication-comment.entity';
import { PublicationMedia } from './publications/entities/publication-media.entity';
import { PublicationReaction } from './publications/entities/publication-reaction.entity';
import { Publication } from './publications/entities/publication.entity';
import { PublicationsModule } from './publications/publications.module';

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
        Publication,
        PublicationMedia,
        Connection,
        Conversation,
        Message,
        PublicationComment,
        PublicationReaction,
        PublicationReport,
      ],
      synchronize: true,
    }),
    CommonModule,
    PublicationsModule,
    ContactsModule,
    PublicationReportsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
