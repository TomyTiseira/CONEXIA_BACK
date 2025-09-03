import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { ContactsController } from './contacts.controller';

@Module({
  imports: [NatsModule],
  controllers: [ContactsController],
})
export class ContactsModule {}
