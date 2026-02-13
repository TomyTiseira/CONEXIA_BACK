import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config';
import { Conversation } from './nexo/entities/conversation.entity';
import { FaqEmbedding } from './nexo/entities/faq-embedding.entity';
import { Message } from './nexo/entities/message.entity';
import { NexoModule } from './nexo/nexo.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(envs.databaseUrl
        ? { url: envs.databaseUrl, ssl: { rejectUnauthorized: true } }
        : {
            host: envs.dbHost,
            port: parseInt(envs.dbPort),
            username: envs.dbUsername,
            password: envs.dbPassword,
            database: envs.dbDatabase,
          }),
      entities: [FaqEmbedding, Conversation, Message],
      synchronize: true,
    }),
    NexoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
