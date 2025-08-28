import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicationsController } from './controllers/publications.controller';
import { Publication } from './entities/publication.entity';
import { PublicationRepository } from './repositories/publication.repository';
import { PublicationsService } from './services/publications.service';
import {
  CreatePublicationUseCase,
  DeletePublicationUseCase,
  EditPublicationUseCase,
  GetPublicationsUseCase,
  GetUserPublicationsUseCase,
} from './services/use-cases';

@Module({
  imports: [TypeOrmModule.forFeature([Publication])],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    PublicationRepository,
    CreatePublicationUseCase,
    EditPublicationUseCase,
    DeletePublicationUseCase,
    GetPublicationsUseCase,
    GetUserPublicationsUseCase,
  ],
})
export class PublicationsModule {}
