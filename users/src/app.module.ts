import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { envs } from './config';
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
      host: envs.dbHost,
      port: parseInt(envs.dbPort),
      username: envs.dbUsername,
      password: envs.dbPassword,
      database: envs.dbDatabase,
      entities: [User, Role, DocumentType, Profile],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    NatsModule,
    ProfileModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
