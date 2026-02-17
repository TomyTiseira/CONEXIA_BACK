import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { envs } from './config';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: envs.natsServers,
        maxPayload: 10 * 1024 * 1024, // 10MB
      },
    },
  );

  await app.listen();
  console.log('Services microservice is listening on NATS');
}
bootstrap().catch((err) => {
  console.error('Error starting Services microservice:', err);
  process.exit(1);
});
