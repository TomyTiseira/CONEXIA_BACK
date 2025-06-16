import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RpcCustomExceptionFilter } from './common/exceptions/rpc-custom-exception.filter';
import { ResponseFormatInterceptor } from './common/interceptors/transform.interceptor';
import { envs } from './config';

async function bootstrap() {
  const logger = new Logger('Main-Gateway');

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new RpcCustomExceptionFilter());
  app.useGlobalInterceptors(new ResponseFormatInterceptor());

  await app.listen(envs.port);

  logger.log(`Server is running on port ${envs.port}`);
}
bootstrap();
