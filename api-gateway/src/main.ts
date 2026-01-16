import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { RpcCustomExceptionFilter } from './common/exceptions/rpc-custom-exception.filter';
import { ResponseFormatInterceptor } from './common/interceptors/transform.interceptor';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('ApiGateway');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  //const app = await NestFactory.create(AppModule);

  // Configurar como microservicio híbrido (HTTP + NATS)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: envs.natsServers,
    },
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || envs.corsOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS not allowed for origin ${origin}`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, Origin, X-Requested-With, Access-Control-Allow-Credentials',
    credentials: true,
  });

  // Servir archivos estáticos ANTES del prefijo global
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Servir archivos de CV específicamente
  app.useStaticAssets(join(process.cwd(), 'uploads', 'cv'), {
    prefix: '/uploads/cv/',
  });

  // Servir archivos de publicaciones específicamente
  app.useStaticAssets(join(process.cwd(), 'uploads', 'publications'), {
    prefix: '/uploads/publications/',
  });

  app.setGlobalPrefix('api');

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new RpcCustomExceptionFilter());
  app.useGlobalInterceptors(new ResponseFormatInterceptor());

  // Iniciar microservicio NATS ANTES de levantar el servidor HTTP
  try {
    await app.startAllMicroservices();
    logger.log('🔌 NATS microservice connected - listening for events');
  } catch (error) {
    logger.error(`❌ Error starting NATS microservice: ${error.message}`);
    logger.error(error.stack);
  }

  await app.listen(envs.port);

  logger.log(`✅ HTTP Server is running on port ${envs.port}`);
}

void bootstrap();
