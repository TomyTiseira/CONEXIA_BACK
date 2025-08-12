import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared/shared.module';
import { PostulationsController } from './controllers/postulations.controller';
import { PostulationStatus } from './entities/postulation-status.entity';
import { Postulation } from './entities/postulation.entity';
import { PostulationStatusRepository } from './repositories/postulation-status.repository';
import { PostulationRepository } from './repositories/postulation.repository';
import { PostulationsService } from './services/postulations.service';
import { CreatePostulationUseCase } from './services/use-cases/create-postulation.use-case';

@Module({
  controllers: [PostulationsController],
  providers: [
    PostulationsService,
    CreatePostulationUseCase,
    PostulationRepository,
    PostulationStatusRepository,
  ],
  imports: [
    TypeOrmModule.forFeature([Postulation, PostulationStatus]),
    SharedModule,
  ],
  exports: [PostulationsService, PostulationRepository],
})
export class PostulationsModule {}
