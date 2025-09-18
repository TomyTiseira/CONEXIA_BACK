import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('Main-Projects');

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: envs.natsServers,
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.listen();
  logger.log('Projects microservice is running');

  // Log de memoria cada 10 segundos
  setInterval(() => {
    const mem = process.memoryUsage();
    logger.log(
      `💾 Memoria: Heap=${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB, RSS=${(mem.rss / 1024 / 1024).toFixed(1)}MB, Externo=${(mem.external / 1024 / 1024).toFixed(1)}MB, ArrayBuffers=${(mem.arrayBuffers / 1024 / 1024).toFixed(1)}MB`,
    );
  }, 10000);
}
bootstrap();
