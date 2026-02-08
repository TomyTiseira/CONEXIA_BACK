import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateServiceReviewReportDto,
  GetServiceReviewReportsDto,
} from './dto';
import { ServiceReviewReport } from './entities/service-review-report.entity';
import { CreateServiceReviewReportUseCase } from './services/use-cases/create-service-review-report.use-case';
import { GetServiceReviewReportsUseCase } from './services/use-cases/get-service-review-reports.use-case';
import { GetServiceReviewsWithReportsUseCase } from './services/use-cases/get-service-reviews-with-reports.use-case';

@Controller()
export class ServiceReviewReportsController {
  constructor(
    private readonly createReportUseCase: CreateServiceReviewReportUseCase,
    private readonly getReportsUseCase: GetServiceReviewReportsUseCase,
    private readonly getReviewsWithReportsUseCase: GetServiceReviewsWithReportsUseCase,
    @InjectRepository(ServiceReviewReport)
    private readonly serviceReviewReportRepository: Repository<ServiceReviewReport>,
  ) {}

  @MessagePattern('create_service_review_report')
  async createReport(
    @Payload() payload: { userId: number; dto: CreateServiceReviewReportDto },
  ) {
    return await this.createReportUseCase.execute(payload.userId, payload.dto);
  }

  @MessagePattern('get_service_review_reports')
  async getServiceReviewReports(@Payload() dto: GetServiceReviewReportsDto) {
    // Si viene serviceReviewId: obtener reportes de esa reseña específica
    if (dto.serviceReviewId) {
      return await this.getReportsUseCase.execute(dto);
    }

    // Si NO viene serviceReviewId: obtener lista de reseñas reportadas
    return await this.getReviewsWithReportsUseCase.execute({
      page: dto.page || 1,
      limit: dto.limit || 10,
      orderBy: dto.orderBy,
    });
  }

  @MessagePattern('getActiveServiceReviewReports')
  async getActiveServiceReviewReports() {
    return await this.serviceReviewReportRepository.find({
      where: { isActive: true },
    });
  }

  @MessagePattern('getAllServiceReviewReports')
  async getAllServiceReviewReports() {
    return await this.serviceReviewReportRepository.find({
      select: ['reason', 'isActive'],
    });
  }
}
