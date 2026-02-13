import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from './config';
import { Benefit } from './membreships/entities/benefit.entity';
import { Subscription } from './membreships/entities/membreship.entity';
import { PlanLog } from './membreships/entities/plan-log.entity';
import { Plan } from './membreships/entities/plan.entity';
import { MembershipsModule } from './membreships/membreships.module';
import { NatsModule } from './transports/nats.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
      entities: [Plan, Benefit, PlanLog, Subscription],
      synchronize: true,
    }),
    MembershipsModule,
    NatsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
