import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from '../common/common.module';
import { PublicationComment } from '../publications/entities/publication-comment.entity';
import { PublicationsModule } from '../publications/publications.module';
import { CommentReportsController } from './controllers/comment-reports.controller';
import { CommentReport } from './entities/comment-report.entity';
import { CommentReportRepository } from './repositories/comment-report.repository';
import { CommentReportValidationService } from './services/comment-report-validation.service';
import { CommentReportsService } from './services/comment-reports.service';
import { GetCommentReportsUseCase } from './services/use-cases/get-comment-reports.use-case';
import { GetCommentsWithReportsUseCase } from './services/use-cases/get-comments-with-reports.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([CommentReport, PublicationComment]),
    forwardRef(() => PublicationsModule),
    CommonModule,
  ],
  controllers: [CommentReportsController],
  providers: [
    CommentReportsService,
    CommentReportRepository,
    CommentReportValidationService,
    GetCommentsWithReportsUseCase,
    GetCommentReportsUseCase,
  ],
  exports: [CommentReportsService, CommentReportRepository],
})
export class CommentReportsModule {}
