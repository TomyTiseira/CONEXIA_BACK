import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from './profile/entities/profile.entity';
import { ProfileModule } from './profile/profile.module';
import { DocumentType } from './shared/entities/document-type.entity';
import { Role } from './shared/entities/role.entity';
import { User } from './shared/entities/user.entity';
import { NatsModule } from './transports/nats.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432'),
      username: process.env.DB_USERNAME ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_DATABASE ?? 'users',
      entities: [User, Role, DocumentType, Profile],
      synchronize: true,
    }),
    UsersModule,
    NatsModule,
    ProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
