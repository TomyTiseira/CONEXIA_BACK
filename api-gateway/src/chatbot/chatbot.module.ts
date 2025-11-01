import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { envs, NATS_SERVICE } from '../config';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './services/chatbot.service';
import { ChatbotGateway } from './websockets/chatbot.gateway';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: NATS_SERVICE,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      verifyOptions: {
        ignoreExpiration: false, // Verificar expiración por defecto
      },
    }),
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatbotGateway],
  exports: [ChatbotService, ChatbotGateway],
})
export class ChatbotModule {}
