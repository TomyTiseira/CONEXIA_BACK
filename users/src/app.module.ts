import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MemoryMonitorService } from './common/services/memory-monitor.service';
import { envs } from './config';
import { InternalUsersModule } from './internal-users/internal-users.module';
import { Profile } from './profile/entities/profile.entity';
import { ProfileModule } from './profile/profile.module';
import { DocumentType } from './shared/entities/document-type.entity';
import { Locality } from './shared/entities/locality.entity';
import { ProfileSkill } from './shared/entities/profile-skill.entity';
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
      entities: [User, Role, DocumentType, Profile, ProfileSkill, Locality],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    NatsModule,
    ProfileModule,
    InternalUsersModule,
  ],
  controllers: [],
  providers: [MemoryMonitorService],
})
export class AppModule {}
