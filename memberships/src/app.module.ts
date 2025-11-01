import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config';
import { Membreship } from './membreships/entities/membreship.entity';
import { MembreshipsModule } from './membreships/membreships.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.dbHost,
      port: parseInt(envs.dbPort),
      username: envs.dbUsername,
      password: envs.dbPassword,
      database: envs.dbDatabase,
      entities: [Membreship],
      synchronize: true,
    }),
    MembreshipsModule,
    NatsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
