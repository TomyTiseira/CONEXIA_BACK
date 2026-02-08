import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateCommentReportDto } from '../dtos/create-comment-report.dto';
import { GetCommentReportsDetailDto } from '../dtos/get-comment-reports-detail.dto';
import { GetCommentReportsDto } from '../dtos/get-comment-reports.dto';
import { CommentReportsService } from '../services/comment-reports.service';
import { GetCommentReportsUseCase } from '../services/use-cases/get-comment-reports.use-case';
import { GetCommentsWithReportsUseCase } from '../services/use-cases/get-comments-with-reports.use-case';

@Controller()
export class CommentReportsController {
  constructor(
    private readonly commentReportsService: CommentReportsService,
    private readonly getCommentsWithReportsUseCase: GetCommentsWithReportsUseCase,
    private readonly getCommentReportsUseCase: GetCommentReportsUseCase,
  ) {}

  @MessagePattern('createCommentReport')
  async createCommentReport(
    @Payload()
    data: {
      createReportDto: CreateCommentReportDto;
      userId: number;
    },
  ) {
    const report = await this.commentReportsService.createReport(
      data.createReportDto,
      data.userId,
    );
    return {
      report,
      message: 'Comment report created successfully',
    };
  }

  @MessagePattern('getCommentReports')
  async getCommentReports(
    @Payload()
    data: {
      commentId: number;
      page: number;
      limit: number;
    },
  ) {
    const getDetailDto: GetCommentReportsDetailDto = {
      commentId: data.commentId,
      page: data.page,
      limit: data.limit,
    };
    return await this.getCommentReportsUseCase.execute(getDetailDto);
  }

  @MessagePattern('getCommentsWithReports')
  async getCommentsWithReports(
    @Payload()
    data: {
      page: number;
      limit: number;
      orderBy: string;
    },
  ) {
    const getReportsDto: GetCommentReportsDto = {
      page: data.page,
      limit: data.limit,
      orderBy: data.orderBy as any,
    };

    return await this.getCommentsWithReportsUseCase.execute(getReportsDto);
  }

  @MessagePattern('getActiveCommentReports')
  async getActiveCommentReports() {
    return await this.commentReportsService.getActiveReports();
  }

  @MessagePattern('getAllCommentReports')
  async getAllCommentReports() {
    return await this.commentReportsService.getAllReportsForMetrics();
  }

  @MessagePattern('softDeleteOldCommentReports')
  async softDeleteOldCommentReports(@Payload() data: { oneYearAgo: Date }) {
    return await this.commentReportsService.softDeleteOldReports(
      data.oneYearAgo,
    );
  }

  @MessagePattern('deactivateCommentReports')
  async deactivateCommentReports(@Payload() data: { reportIds: number[] }) {
    return await this.commentReportsService.deactivateReports(data.reportIds);
  }
}
