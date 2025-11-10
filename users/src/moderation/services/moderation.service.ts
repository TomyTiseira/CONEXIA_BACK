import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { firstValueFrom } from 'rxjs';
import { Repository } from 'typeorm';
import { NATS_SERVICE } from '../config';
import { ModerationAnalysis } from '../entities/moderation-analysis.entity';
import {
  AnalyzedReportsResponse,
  ReportDetail,
} from '../interfaces/analyzed-reports-response.interface';
import {
  NotificationPayload,
  OpenAIModerationResult,
  ReportData,
  UserReportsGroup,
} from '../interfaces/moderation.interface';
import { OpenAIService } from './openai.service';

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    @InjectRepository(ModerationAnalysis)
    private readonly moderationRepository: Repository<ModerationAnalysis>,
    private readonly openAIService: OpenAIService,
    @Inject(NATS_SERVICE) private readonly natsClient: ClientProxy,
  ) {}

  /**
   * Cron job que se ejecuta todos los días a las 2 AM
   * Analiza automáticamente los reportes activos
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleScheduledAnalysis() {
    this.logger.log('Ejecutando análisis automático programado...');
    try {
      await this.analyzeReports(0); // 0 = sistema automático
      this.logger.log('Análisis automático completado exitosamente');
    } catch (error) {
      this.logger.error('Error en análisis automático programado:', error);
    }
  }

  /**
   * Analiza todos los reportes activos y genera análisis de moderación
   */
  async analyzeReports(triggeredBy: number) {
    this.logger.log(
      `Iniciando análisis de reportes. Ejecutado por usuario ${triggeredBy}`,
    );

    try {
      // 1. Soft-delete de reportes con más de 1 año
      await this.softDeleteOldReports();

      // 2. Obtener todos los reportes activos de todos los microservicios
      const userReportsGroups = await this.getAllActiveReportsByUser();

      this.logger.log(
        `Se encontraron ${userReportsGroups.length} usuarios con reportes activos`,
      );

      const results: ModerationAnalysis[] = [];

      // 3. Analizar cada grupo de reportes con batch/throttling
      const batchSize = 10; // usuarios por batch
      const batchDelayMs = 15000; // 15 segundos entre batches (ajustable)
      let batchCount = 0;
      for (let i = 0; i < userReportsGroups.length; i += batchSize) {
        const batch = userReportsGroups.slice(i, i + batchSize);
        this.logger.log(
          `Procesando batch ${++batchCount}: usuarios ${i + 1} a ${i + batch.length}`,
        );
        const batchPromises = batch.map(async (group) => {
          try {
            const analysis = await this.analyzeUserReports(group);
            results.push(analysis);
          } catch (error) {
            this.logger.error(
              `Error al analizar reportes del usuario ${group.userId}:`,
              error,
            );
          }
        });
        await Promise.all(batchPromises);
        if (i + batchSize < userReportsGroups.length) {
          this.logger.log(
            `Esperando ${batchDelayMs / 1000}s antes del siguiente batch para evitar rate limit...`,
          );
          await new Promise((res) => setTimeout(res, batchDelayMs));
        }
      }

      this.logger.log(
        `Análisis completado. ${results.length} usuarios analizados`,
      );

      // 4. Enviar notificaciones a moderadores sobre análisis pendientes
      await this.notifyModeratorsAboutPendingAnalysis();

      return {
        success: true,
        analyzed: results.length,
        results,
      };
    } catch (error) {
      this.logger.error('Error en el análisis de reportes:', error);
      throw new Error('Error al analizar los reportes con IA');
    }
  }

  /**
   * Marca como inactivos los reportes con más de 1 año en todos los microservicios
   */
  private async softDeleteOldReports() {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    try {
      // Soft-delete en publications (via NATS)
      await firstValueFrom(
        this.natsClient.send('softDeleteOldPublicationReports', { oneYearAgo }),
      );

      // Soft-delete en services (via NATS)
      await firstValueFrom(
        this.natsClient.send('softDeleteOldServiceReports', { oneYearAgo }),
      );

      // Soft-delete en projects (via NATS)
      await firstValueFrom(
        this.natsClient.send('softDeleteOldProjectReports', { oneYearAgo }),
      );

      this.logger.log('Reportes antiguos marcados como inactivos');
    } catch (error) {
      this.logger.warn(
        'Error al marcar reportes antiguos como inactivos:',
        error,
      );
    }
  }

  /**
   * Obtiene los reportes activos de todos los microservicios y los agrupa por usuario
   */
  private async getAllActiveReportsByUser(): Promise<UserReportsGroup[]> {
    try {
      // Obtener reportes de publicaciones
      const publicationReports = await firstValueFrom(
        this.natsClient.send<ReportData[]>('getActivePublicationReports', {}),
      );

      // Obtener reportes de servicios
      const serviceReports = await firstValueFrom(
        this.natsClient.send<ReportData[]>('getActiveServiceReports', {}),
      );

      // Obtener reportes de proyectos
      const projectReports = await firstValueFrom(
        this.natsClient.send<ReportData[]>('getActiveProjectReports', {}),
      );

      // Consolidar todos los reportes
      const allReports: ReportData[] = [
        ...(Array.isArray(publicationReports)
          ? publicationReports.map((r) => ({
              ...r,
              source: 'publications' as const,
            }))
          : []),
        ...(Array.isArray(serviceReports)
          ? serviceReports.map((r) => ({
              ...r,
              source: 'services' as const,
            }))
          : []),
        ...(Array.isArray(projectReports)
          ? projectReports.map((r) => ({
              ...r,
              source: 'projects' as const,
            }))
          : []),
      ];

      // Agrupar por usuario reportado
      const groupedByUser = new Map<number, UserReportsGroup>();

      for (const report of allReports) {
        const userId = report.reportedUserId;
        if (!userId) continue;

        if (!groupedByUser.has(userId)) {
          groupedByUser.set(userId, {
            userId,
            reports: [],
          });
        }

        const userGroup = groupedByUser.get(userId);
        if (userGroup) {
          userGroup.reports.push(report);
        }
      }

      const groupedArray = Array.from(groupedByUser.values());

      return groupedArray;
    } catch (error) {
      this.logger.error('Error al obtener reportes de microservicios:', error);
      return [];
    }
  }

  /**
   * Analiza los reportes de un usuario específico
   */
  private async analyzeUserReports(
    group: UserReportsGroup,
  ): Promise<ModerationAnalysis> {
    const allReports = group.reports;

    let offensiveCount = 0;
    let violationCount = 0;
    const reportDetails: string[] = [];
    const analyzedIds: string[] = [];

    // Concatenar todos los reportes en un solo texto para analizar
    const textToAnalyze = allReports
      .map((report) => {
        let resourceInfo = '';
        if (report.resourceTitle) {
          resourceInfo += `Título: ${report.resourceTitle}. `;
        }
        if (report.resourceDescription) {
          resourceInfo += `Descripción: ${report.resourceDescription}. `;
        }
        return `[${report.source}] ${resourceInfo}Reporte: Razón: ${report.reason}. Desc: ${report.description}${
          report.otherReason ? '. ' + report.otherReason : ''
        }`;
      })
      .join('\n');

    try {
      // Solo una llamada a OpenAI para todos los reportes del usuario
      const moderation: OpenAIModerationResult =
        await this.openAIService.moderateText(textToAnalyze);

      // Clasificar según las categorías detectadas
      if (
        moderation.flagged &&
        (moderation.categories.hate ||
          moderation.categories.harassment ||
          moderation.categories['harassment/threatening'] ||
          moderation.categories['hate/threatening'])
      ) {
        offensiveCount = allReports.length;
      }

      // Considerar incumplimientos basados en el reason
      for (const report of allReports) {
        if (
          report.reason.toLowerCase().includes('engañoso') ||
          report.reason.toLowerCase().includes('fraudulento') ||
          report.reason.toLowerCase().includes('falsa')
        ) {
          violationCount++;
        }
        reportDetails.push(
          `[${report.source}] Razón: ${report.reason}. Desc: ${report.description.substring(0, 100)}`,
        );
        const prefix =
          report.source === 'publications'
            ? 'pub'
            : report.source === 'services'
              ? 'svc'
              : 'prj';
        analyzedIds.push(`${prefix}:${report.id}`);
      }
    } catch (error) {
      this.logger.warn(
        `No se pudo analizar los reportes del usuario ${group.userId} con OpenAI:`,
        error,
      );
    }

    // Determinar clasificación
    const classification = this.determineClassification(
      allReports.length,
      offensiveCount,
      violationCount,
    );

    // Generar resumen con GPT
    const aiSummary = await this.openAIService.generateSummary(
      group.userId,
      allReports.length,
      offensiveCount,
      violationCount,
      classification,
      reportDetails,
    );

    // Guardar análisis
    const analysis = this.moderationRepository.create({
      userId: group.userId,
      analyzedReportIds: analyzedIds,
      totalReports: allReports.length,
      offensiveReports: offensiveCount,
      violationReports: violationCount,
      classification,
      aiSummary,
    });

    // Validar si ya existe un análisis pendiente con los mismos reportes
    const pendingAnalyses = await this.moderationRepository.find({
      where: {
        userId: group.userId,
        resolved: false,
      },
    });
    const analyzedSet = new Set(analyzedIds);
    const existing = pendingAnalyses.find(
      (a) =>
        a.analyzedReportIds.length === analyzedIds.length &&
        a.analyzedReportIds.every((id) => analyzedSet.has(id)),
    );
    if (existing) {
      this.logger.log(
        `Ya existe un análisis pendiente para el usuario ${group.userId} con los mismos reportes. Se omite la creación.`,
      );
      return existing;
    }

    return await this.moderationRepository.save(analysis);
  }

  /**
   * Determina la clasificación según las reglas de negocio
   */
  private determineClassification(
    total: number,
    offensive: number,
    violation: number,
  ): 'Revisar' | 'Banear' {
    // Si tiene 3 o más reportes ofensivos/racistas → Banear
    if (offensive >= 3) {
      return 'Banear';
    }

    // Si tiene 10 o más reportes variados → Revisar
    if (total >= 10) {
      return 'Revisar';
    }

    // Si tiene 2 o más reportes de incumplimiento → Revisar
    if (violation >= 2) {
      return 'Revisar';
    }

    // Por defecto, revisar
    return 'Revisar';
  }

  /**
   * Envía notificaciones a administradores y moderadores sobre análisis pendientes
   */
  private async notifyModeratorsAboutPendingAnalysis() {
    try {
      // Obtener análisis pendientes que no han sido notificados
      const pendingAnalysis = await this.moderationRepository.find({
        where: { resolved: false, notified: false },
      });

      if (pendingAnalysis.length === 0) {
        this.logger.log('No hay análisis pendientes para notificar');
        return;
      }

      this.logger.log(
        `Notificando ${pendingAnalysis.length} análisis pendientes a moderadores`,
      );

      // Preparar notificaciones
      const notifications: NotificationPayload[] = pendingAnalysis.map(
        (analysis) => ({
          analysisId: analysis.id,
          userId: analysis.userId,
          classification: analysis.classification,
          totalReports: analysis.totalReports,
          aiSummary: analysis.aiSummary,
        }),
      );

      // Enviar notificación via NATS al microservicio correspondiente
      await firstValueFrom(
        this.natsClient.emit('notifyModeratorsAboutReports', {
          notifications,
          count: pendingAnalysis.length,
        }),
      );

      // Marcar como notificados
      for (const analysis of pendingAnalysis) {
        analysis.notified = true;
        analysis.notifiedAt = new Date();
        await this.moderationRepository.save(analysis);
      }

      this.logger.log('Notificaciones enviadas exitosamente');
    } catch (error) {
      this.logger.error('Error al enviar notificaciones a moderadores:', error);
    }
  }

  /**
   * Obtiene los resultados de análisis con paginación y filtros
   */
  async getResults(
    page: number = 1,
    limit: number = 10,
    resolved?: boolean,
    classification?: string,
  ) {
    const queryBuilder = this.moderationRepository.createQueryBuilder('ma');

    if (resolved !== undefined) {
      queryBuilder.andWhere('ma.resolved = :resolved', { resolved });
    }

    if (classification) {
      queryBuilder.andWhere('ma.classification = :classification', {
        classification,
      });
    }

    const [results, total] = await queryBuilder
      .orderBy('ma.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Obtener perfiles de los usuarios reportados
    const userIds = results.map((r) => r.userId);
    const profiles = await this.moderationRepository.manager
      .createQueryBuilder('profiles', 'p')
      .select(['p.userId', 'p.name', 'p.lastName'])
      .where('p.userId IN (:...userIds)', { userIds })
      .getRawMany();

    // Mapear userId a nombre y apellido
    const profileMap = new Map<number, { name: string; lastName: string }>();
    for (const p of profiles as Array<{
      p_userId: number;
      p_name: string;
      p_lastName: string;
    }>) {
      profileMap.set(Number(p.p_userId), {
        name: String(p.p_name),
        lastName: String(p.p_lastName),
      });
    }

    // Agregar nombre y apellido a cada resultado
    // Obtener los emails de los moderadores que resolvieron los análisis
    const resolvedModeratorIds = results
      .filter((r) => r.resolved && r.resolvedBy)
      .map((r) => r.resolvedBy);
    const moderatorEmailMap = new Map<number, string>();
    if (resolvedModeratorIds.length > 0) {
      const moderators = await this.moderationRepository.manager
        .createQueryBuilder('users', 'u')
        .select(['u.id', 'u.email'])
        .where('u.id IN (:...ids)', { ids: resolvedModeratorIds })
        .getRawMany();
      for (const m of moderators as Array<{ u_id: number; u_email: string }>) {
        moderatorEmailMap.set(Number(m.u_id), String(m.u_email));
      }
    }
    const resultsWithNames = results.map((r) => ({
      ...r,
      firstName: profileMap.get(r.userId)?.name || null,
      lastName: profileMap.get(r.userId)?.lastName || null,
      resolvedByEmail:
        r.resolved && r.resolvedBy
          ? moderatorEmailMap.get(r.resolvedBy) || null
          : null,
      resolutionAction: r.resolutionAction || null,
      resolutionNotes: r.resolutionNotes || null,
    }));

    return {
      data: resultsWithNames,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Resuelve un análisis de moderación
   */
  async resolveAnalysis(
    analysisId: number,
    action: 'ban_user' | 'release_user' | 'keep_monitoring',
    moderatorId: number,
    notes?: string,
  ) {
    const analysis = await this.moderationRepository.findOne({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundException(
        `Análisis con ID ${analysisId} no encontrado`,
      );
    }

    if (analysis.resolved) {
      throw new Error('Este análisis ya fue resuelto previamente');
    }

    // Actualizar el análisis
    analysis.resolved = true;
    analysis.resolvedBy = moderatorId;
    analysis.resolvedAt = new Date();
    analysis.resolutionAction = action;
    analysis.resolutionNotes = notes || null;

    await this.moderationRepository.save(analysis);

    // Marcar reportes relacionados como inactivos
    await this.deactivateRelatedReports(analysis.analyzedReportIds);

    this.logger.log(
      `Análisis ${analysisId} resuelto por moderador ${moderatorId} con acción: ${action}`,
    );

    return analysis;
  }

  /**
   * Marca los reportes relacionados como inactivos en todos los microservicios
   */
  private async deactivateRelatedReports(reportIds: string[]) {
    // Separar IDs por tipo
    const publicationIds: number[] = [];
    const serviceIds: number[] = [];
    const projectIds: number[] = [];

    for (const id of reportIds) {
      const [prefix, numId] = id.split(':');
      const reportId = parseInt(numId);

      if (prefix === 'pub') {
        publicationIds.push(reportId);
      } else if (prefix === 'svc') {
        serviceIds.push(reportId);
      } else if (prefix === 'prj') {
        projectIds.push(reportId);
      }
    }

    // Desactivar reportes en cada microservicio
    try {
      if (publicationIds.length > 0) {
        await firstValueFrom(
          this.natsClient.send('deactivatePublicationReports', {
            reportIds: publicationIds,
          }),
        );
      }

      if (serviceIds.length > 0) {
        await firstValueFrom(
          this.natsClient.send('deactivateServiceReports', {
            reportIds: serviceIds,
          }),
        );
      }

      if (projectIds.length > 0) {
        await firstValueFrom(
          this.natsClient.send('deactivateProjectReports', {
            reportIds: projectIds,
          }),
        );
      }

      this.logger.log(
        `Reportes desactivados: ${publicationIds.length} publications, ${serviceIds.length} services, ${projectIds.length} projects`,
      );
    } catch (error) {
      this.logger.error('Error al desactivar reportes:', error);
    }
  }

  /**
   * Obtiene los detalles completos de todos los reportes analizados por la IA
   * Consulta a los microservicios de services, projects y publications
   */
  async getAnalyzedReportsDetails(
    analysisId: number,
  ): Promise<AnalyzedReportsResponse> {
    // Buscar el análisis
    const analysis = await this.moderationRepository.findOne({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundException(
        `Análisis con ID ${analysisId} no encontrado`,
      );
    }

    // Obtener el perfil del usuario reportado
    const profile = await this.moderationRepository.manager
      .createQueryBuilder('profiles', 'p')
      .select(['p.userId', 'p.name', 'p.lastName'])
      .where('p.userId = :userId', { userId: analysis.userId })
      .getRawOne<{ p_userId: number; p_name: string; p_lastName: string }>();

    const userProfile = profile
      ? {
          name: String(profile.p_name),
          lastName: String(profile.p_lastName),
        }
      : { name: null, lastName: null };

    // Separar los IDs por tipo de reporte
    const serviceIds: number[] = [];
    const projectIds: number[] = [];
    const publicationIds: number[] = [];

    for (const id of analysis.analyzedReportIds || []) {
      const [prefix, numId] = id.split(':');
      const reportId = parseInt(numId);

      if (prefix === 'svc') {
        serviceIds.push(reportId);
      } else if (prefix === 'prj') {
        projectIds.push(reportId);
      } else if (prefix === 'pub') {
        publicationIds.push(reportId);
      }
    }

    // Consultar detalles a cada microservicio en paralelo
    const [serviceReports, projectReports, publicationReports] =
      await Promise.all([
        this.fetchServiceReportsDetails(serviceIds),
        this.fetchProjectReportsDetails(projectIds),
        this.fetchPublicationReportsDetails(publicationIds),
      ]);

    return {
      analysisId: analysis.id,
      userId: analysis.userId,
      firstName: userProfile.name,
      lastName: userProfile.lastName,
      totalReports: analysis.totalReports,
      classification: analysis.classification,
      aiSummary: analysis.aiSummary,
      createdAt: analysis.createdAt,
      reports: {
        services: serviceReports,
        projects: projectReports,
        publications: publicationReports,
      },
    };
  }

  /**
   * Obtiene detalles de reportes de servicios
   */
  private async fetchServiceReportsDetails(
    reportIds: number[],
  ): Promise<ReportDetail[]> {
    if (reportIds.length === 0) return [];

    try {
      const reports = await firstValueFrom(
        this.natsClient.send<ReportDetail[]>('getServiceReportsByIds', {
          reportIds,
        }),
      );
      return reports || [];
    } catch (error) {
      this.logger.error(
        `Error al obtener detalles de reportes de servicios:`,
        error,
      );
      return [];
    }
  }

  /**
   * Obtiene detalles de reportes de proyectos
   */
  private async fetchProjectReportsDetails(
    reportIds: number[],
  ): Promise<ReportDetail[]> {
    if (reportIds.length === 0) return [];

    try {
      const reports = await firstValueFrom(
        this.natsClient.send<ReportDetail[]>('getProjectReportsByIds', {
          reportIds,
        }),
      );
      return reports || [];
    } catch (error) {
      this.logger.error(
        `Error al obtener detalles de reportes de proyectos:`,
        error,
      );
      return [];
    }
  }

  /**
   * Obtiene detalles de reportes de publicaciones
   */
  private async fetchPublicationReportsDetails(
    reportIds: number[],
  ): Promise<ReportDetail[]> {
    if (reportIds.length === 0) return [];

    try {
      const reports = await firstValueFrom(
        this.natsClient.send<ReportDetail[]>('getPublicationReportsByIds', {
          reportIds,
        }),
      );
      return reports || [];
    } catch (error) {
      this.logger.error(
        `Error al obtener detalles de reportes de publicaciones:`,
        error,
      );
      return [];
    }
  }
}
