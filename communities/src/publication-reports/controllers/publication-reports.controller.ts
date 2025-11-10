import { Controller } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { CreatePublicationReportDto, GetPublicationReportsDto } from '../dtos';
import { GetPublicationReportsDetailDto } from '../dtos/get-publication-reports-detail.dto';
import {
  InvalidReportReasonException,
  PublicationAlreadyReportedException,
  PublicationNotActiveException,
  PublicationNotFoundException,
  UserNotFoundException,
} from '../exceptions/publication-report.exceptions';
import { PublicationReportsService } from '../services/publication-reports.service';
import { GetPublicationReportsUseCase } from '../services/use-cases/get-publication-reports.use-case';
import { GetPublicationsWithReportsUseCase } from '../services/use-cases/get-publications-with-reports.use-case';

@Controller()
export class PublicationReportsController {
  constructor(
    private readonly publicationReportsService: PublicationReportsService,
    private readonly getPublicationsWithReportsUseCase: GetPublicationsWithReportsUseCase,
    private readonly getPublicationReportsUseCase: GetPublicationReportsUseCase,
  ) {}

  @MessagePattern('createPublicationReport')
  async createPublicationReport(
    @Payload()
    data: {
      createReportDto: CreatePublicationReportDto;
      userId: number;
    },
  ) {
    try {
      const report = await this.publicationReportsService.createReport(
        data.createReportDto,
        data.userId,
      );
      return {
        report,
        message: 'Publication report created successfully',
      };
    } catch (error) {
      console.error('Error creating publication report:', error);

      // Mapear excepciones personalizadas a RpcException con códigos de estado
      if (error instanceof PublicationNotFoundException) {
        throw new RpcException({
          statusCode: 404,
          message: error.message,
          error: 'Not Found',
        });
      }

      if (error instanceof PublicationNotActiveException) {
        throw new RpcException({
          statusCode: 404,
          message: error.message,
          error: 'Not Found',
        });
      }

      if (error instanceof PublicationAlreadyReportedException) {
        throw new RpcException({
          statusCode: 409,
          message: error.message,
          error: 'Conflict',
        });
      }

      if (error instanceof UserNotFoundException) {
        throw new RpcException({
          statusCode: 404,
          message: error.message,
          error: 'Not Found',
        });
      }

      if (error instanceof InvalidReportReasonException) {
        throw new RpcException({
          statusCode: 400,
          message: error.message,
          error: 'Bad Request',
        });
      }

      // Para cualquier otro error
      throw new RpcException({
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
      });
    }
  }

  @MessagePattern('getPublicationReports')
  async getPublicationReports(
    @Payload() getReportsDto: GetPublicationReportsDto,
  ) {
    try {
      const { publicationId } = getReportsDto;

      // Si se proporciona publicationId, devolver reportes individuales de esa publicación
      if (publicationId) {
        const getDetailDto: GetPublicationReportsDetailDto = {
          publicationId,
          page: getReportsDto.page,
          limit: getReportsDto.limit,
        };
        return await this.getPublicationReportsUseCase.execute(getDetailDto);
      }

      // Si no se proporciona publicationId, devolver publicaciones agrupadas
      return await this.getPublicationsWithReportsUseCase.execute(
        getReportsDto,
      );
    } catch (error) {
      console.error('Error getting publication reports:', error);
      throw error;
    }
  }

  @MessagePattern('getPublicationsWithReports')
  async getPublicationsWithReports(
    @Payload()
    data: {
      page: number;
      limit: number;
      orderBy: string;
    },
  ) {
    try {
      const getReportsDto: GetPublicationReportsDto = {
        page: data.page,
        limit: data.limit,
        orderBy: data.orderBy as any,
      };

      return await this.getPublicationsWithReportsUseCase.execute(
        getReportsDto,
      );
    } catch (error) {
      console.error('Error getting publications with reports:', error);
      throw error;
    }
  }

  @MessagePattern('getActivePublicationReports')
  async getActivePublicationReports() {
    try {
      return await this.publicationReportsService.getActiveReports();
    } catch (error) {
      console.error('Error getting active publication reports:', error);
      throw error;
    }
  }

  @MessagePattern('softDeleteOldPublicationReports')
  async softDeleteOldPublicationReports(@Payload() data: { oneYearAgo: Date }) {
    try {
      return await this.publicationReportsService.softDeleteOldReports(
        data.oneYearAgo,
      );
    } catch (error) {
      console.error('Error soft deleting old publication reports:', error);
      throw error;
    }
  }

  @MessagePattern('deactivatePublicationReports')
  async deactivatePublicationReports(@Payload() data: { reportIds: number[] }) {
    try {
      return await this.publicationReportsService.deactivateReports(
        data.reportIds,
      );
    } catch (error) {
      console.error('Error deactivating publication reports:', error);
      throw error;
    }
  }

  @MessagePattern('getPublicationReportsByIds')
  async getPublicationReportsByIds(@Payload() data: { reportIds: number[] }) {
    try {
      return await this.publicationReportsService.getReportsByIds(
        data.reportIds,
      );
    } catch (error) {
      console.error('Error getting publication reports by IDs:', error);
      throw error;
    }
  }
}
