import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsModule } from '../contacts/contacts.module';
import { Publication } from '../publications/entities/publication.entity';
import { ModerationController } from './controllers/moderation.controller';
import { NatsModule } from './nats/nats.module';
import { ModerationListenerService } from './services/moderation-listener.service';
import { UsersService } from './services/users.service';

@Module({
  imports: [
    NatsModule,
    TypeOrmModule.forFeature([Publication]),
    forwardRef(() => ContactsModule),
  ],
  providers: [UsersService, ModerationListenerService],
  controllers: [ModerationController],
  exports: [UsersService],
})
export class CommonModule {}
