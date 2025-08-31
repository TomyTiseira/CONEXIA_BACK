import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { PublicationsController } from './controllers/publications.controller';
import { Publication } from './entities/publication.entity';
import { PublicationRepository } from './repositories/publication.repository';
import { OwnerHelperService } from './services/helpers/owner-helper.service';
import { PublicationsService } from './services/publications.service';
import {
  CreatePublicationUseCase,
  DeletePublicationUseCase,
  EditPublicationUseCase,
  GetPublicationByIdUseCase,
  GetPublicationsUseCase,
  GetUserPublicationsUseCase,
} from './services/use-cases';

@Module({
  imports: [TypeOrmModule.forFeature([Publication]), CommonModule],
  controllers: [PublicationsController],
  providers: [
    PublicationsService,
    PublicationRepository,
    OwnerHelperService,
    CreatePublicationUseCase,
    EditPublicationUseCase,
    DeletePublicationUseCase,
    GetPublicationsUseCase,
    GetPublicationByIdUseCase,
    GetUserPublicationsUseCase,
  ],
})
export class PublicationsModule {}
