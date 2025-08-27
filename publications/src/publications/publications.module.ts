import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Publication } from './entities/publication.entity';
import { PublicationsController } from './publications.controller';
import { PublicationsService } from './publications.service';
import { PublicationRepository } from './repositories/publication.repository';
import {
  CreatePublicationUseCase,
  GetPublicationByIdUseCase,
  GetPublicationsUseCase,
} from './use-cases';

@Module({
  imports: [TypeOrmModule.forFeature([Publication])],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    PublicationRepository,
    CreatePublicationUseCase,
    GetPublicationsUseCase,
    GetPublicationByIdUseCase,
  ],
})
export class PublicationsModule {}
