import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersClientService } from '../../../../common/services/users-client.service';
import { PostulationRepository } from '../../../../postulations/repositories/postulation.repository';
import {
  OpenAnswerDto,
  PostulationEvaluationResultDto,
  PostulationsByRoleDto,
  ProjectPostulationsStatsDto,
  QuestionAnswerDistributionDto,
  RoleEvaluationStatsDto,
} from '../../../dtos/project-postulations-stats.dto';
import { ProjectRepository } from '../../../repositories/project.repository';
import { PostulationStatusCode } from 'src/postulations/enums/postulation-status.enum';

@Injectable()
export class GetProjectPostulationsStatsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly postulationRepository: PostulationRepository,
    private readonly usersClientService: UsersClientService,
  ) {}

  async execute(
    projectId: number,
    userId: number,
  ): Promise<ProjectPostulationsStatsDto> {
    // Verificar que el proyecto existe y pertenece al usuario
    const project =
      await this.projectRepository.findByIdWithRelations(projectId);

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to view this project statistics',
      );
    }

    // Obtener todas las postulaciones del proyecto con sus relaciones
    const allPostulations =
      await this.postulationRepository.findByProjectIdWithDetails(projectId);

    // Filtrar postulaciones canceladas
    const postulations = allPostulations.filter(
      (p) => p.status?.code !== PostulationStatusCode.CANCELLED,
    );

    // Calcular total de postulaciones
    const totalPostulations = postulations.length;

    // Calcular postulaciones por rol
    const postulationsByRole = this.calculatePostulationsByRole(
      postulations,
      project.roles,
    );

    // Calcular estadísticas de evaluación por rol
    const evaluationStatsByRole = this.calculateEvaluationStatsByRole(
      project.roles,
      postulations,
    );

    // Obtener información de usuarios para los resultados de evaluación
    await this.enrichEvaluationResultsWithUserNames(evaluationStatsByRole);

    return {
      projectId: project.id,
      projectTitle: project.title,
      totalPostulations,
      postulationsByRole,
      evaluationStatsByRole,
    };
  }

  private calculatePostulationsByRole(
    postulations: any[],
    roles: any[],
  ): PostulationsByRoleDto[] {
    const roleMap = new Map<number, { name: string; count: number }>();

    // Inicializar todos los roles con conteo 0
    roles.forEach((role) => {
      roleMap.set(role.id, { name: role.title, count: 0 });
    });

    // Contar postulaciones por rol
    postulations.forEach((postulation) => {
      if (postulation.roleId && roleMap.has(postulation.roleId)) {
        const roleData = roleMap.get(postulation.roleId)!;
        roleData.count++;
      }
    });

    // Convertir a array de DTOs
    return Array.from(roleMap.entries()).map(([roleId, data]) => ({
      roleId,
      roleName: data.name,
      totalPostulations: data.count,
    }));
  }

  private calculateEvaluationStatsByRole(
    roles: any[],
    postulations: any[],
  ): RoleEvaluationStatsDto[] {
    const stats: RoleEvaluationStatsDto[] = [];

    for (const role of roles) {
      const rolePostulations = postulations.filter((p) => p.roleId === role.id);

      if (rolePostulations.length === 0) {
        continue; // Saltar roles sin postulaciones
      }

      const stat: RoleEvaluationStatsDto = {
        roleId: role.id,
        roleName: role.title,
        totalPostulations: rolePostulations.length,
        hasQuestionsWithCorrectAnswer: false,
        hasEvaluationFile: role.evaluations && role.evaluations.length > 0,
      };

      // Analizar preguntas si existen
      const hasQuestions = role.questions && role.questions.length > 0;
      if (hasQuestions) {
        const questions = role.questions;

        // Verificar si hay preguntas con respuesta correcta
        const questionsWithCorrectAnswer = questions.filter((q: any) =>
          q.options?.some((opt: any) => opt.isCorrect),
        );

        stat.hasQuestionsWithCorrectAnswer =
          questionsWithCorrectAnswer.length > 0;

        if (stat.hasQuestionsWithCorrectAnswer) {
          // Calcular resultados de evaluación
          stat.evaluationResults = this.calculateEvaluationResults(
            rolePostulations,
            questionsWithCorrectAnswer,
          );
        }

        // Preguntas de opción múltiple sin respuesta correcta
        const multipleChoiceWithoutCorrect = questions.filter(
          (q: any) =>
            q.questionType === 'MULTIPLE_CHOICE' &&
            !q.options?.some((opt: any) => opt.isCorrect),
        );

        if (multipleChoiceWithoutCorrect.length > 0) {
          stat.multipleChoiceDistribution =
            this.calculateMultipleChoiceDistribution(
              rolePostulations,
              multipleChoiceWithoutCorrect,
            );
        }

        // Preguntas abiertas
        const openQuestions = questions.filter(
          (q: any) => q.questionType === 'OPEN',
        );

        if (openQuestions.length > 0) {
          stat.openAnswers = this.calculateOpenAnswers(
            rolePostulations,
            openQuestions,
          );
        }
      }

      stats.push(stat);
    }

    return stats;
  }

  private calculateEvaluationResults(
    postulations: any[],
    questionsWithCorrectAnswer: any[],
  ): PostulationEvaluationResultDto[] {
    const results: PostulationEvaluationResultDto[] = [];

    for (const postulation of postulations) {
      const answers = postulation.answers || [];
      let correctCount = 0;

      for (const question of questionsWithCorrectAnswer) {
        const answer = answers.find((a: any) => a.questionId === question.id);
        if (answer && answer.optionId) {
          const selectedOption = question.options?.find(
            (opt: any) => opt.id === answer.optionId,
          );
          if (selectedOption?.isCorrect) {
            correctCount++;
          }
        }
      }

      const totalQuestions = questionsWithCorrectAnswer.length;
      const percentage =
        totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;

      results.push({
        postulationId: postulation.id,
        userId: postulation.userId,
        roleId: postulation.roleId,
        correctAnswers: correctCount,
        totalQuestions,
        percentage: Math.round(percentage * 100) / 100,
      });
    }

    return results.sort((a, b) => b.percentage - a.percentage);
  }

  private calculateMultipleChoiceDistribution(
    postulations: any[],
    questions: any[],
  ): QuestionAnswerDistributionDto[] {
    const distribution: QuestionAnswerDistributionDto[] = [];

    for (const question of questions) {
      const optionCounts = new Map<
        number,
        { text: string; count: number; isCorrect?: boolean }
      >();

      // Inicializar contadores para cada opción
      question.options?.forEach((option: any) => {
        optionCounts.set(option.id, {
          text: option.optionText,
          count: 0,
          isCorrect: option.isCorrect || false,
        });
      });

      // Contar respuestas
      for (const postulation of postulations) {
        const answer = postulation.answers?.find(
          (a: any) => a.questionId === question.id,
        );
        if (answer && answer.optionId && optionCounts.has(answer.optionId)) {
          const optionData = optionCounts.get(answer.optionId)!;
          optionData.count++;
        }
      }

      // ✅ CAMBIO: Siempre incluir la pregunta, incluso sin respuestas (count = 0)
      distribution.push({
        questionId: question.id,
        questionText: question.questionText,
        answers: Array.from(optionCounts.entries()).map(([optionId, data]) => ({
          optionId,
          optionText: data.text,
          count: data.count,
          isCorrect: data.isCorrect,
        })),
      });
    }

    return distribution;
  }

  private calculateOpenAnswers(
    postulations: any[],
    questions: any[],
  ): OpenAnswerDto[] {
    const openAnswers: OpenAnswerDto[] = [];

    for (const question of questions) {
      const answers: OpenAnswerDto['answers'] = [];

      for (const postulation of postulations) {
        const answer = postulation.answers?.find(
          (a: any) => a.questionId === question.id,
        );
        if (answer && answer.answerText) {
          answers.push({
            postulationId: postulation.id,
            userId: postulation.userId,
            answerText: answer.answerText,
          });
        }
      }

      // ✅ CAMBIO: Incluir TODAS las preguntas, incluso sin respuestas
      openAnswers.push({
        questionId: question.id,
        questionText: question.questionText,
        answers,
      });
    }

    return openAnswers;
  }

  /**
   * Enriquece los resultados de evaluación con los nombres de usuario
   */
  private async enrichEvaluationResultsWithUserNames(
    evaluationStatsByRole: RoleEvaluationStatsDto[],
  ): Promise<void> {
    // Recopilar todos los userIds únicos de los resultados de evaluación y respuestas abiertas
    const userIds = new Set<number>();

    for (const stat of evaluationStatsByRole) {
      if (stat.evaluationResults) {
        for (const result of stat.evaluationResults) {
          userIds.add(result.userId);
        }
      }

      // ✅ NUEVO: Recopilar userIds de respuestas abiertas
      if (stat.openAnswers) {
        for (const openAnswer of stat.openAnswers) {
          for (const answer of openAnswer.answers) {
            userIds.add(answer.userId);
          }
        }
      }
    }

    // Si no hay usuarios, retornar
    if (userIds.size === 0) {
      return;
    }

    // Obtener información de todos los usuarios en una sola llamada
    const users = await this.usersClientService.getUsersByIds(
      Array.from(userIds),
    );

    // Crear un mapa de userId -> userName para acceso rápido
    const userMap = new Map<number, string>();
    for (const user of users) {
      if (user && user.id) {
        // Los nombres están en el objeto profile anidado
        const firstName = user.profile?.name || '';
        const lastName = user.profile?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        userMap.set(user.id, fullName || `Usuario #${user.id}`);
      }
    }

    // Asignar los nombres de usuario a los resultados
    for (const stat of evaluationStatsByRole) {
      if (stat.evaluationResults) {
        for (const result of stat.evaluationResults) {
          result.userName =
            userMap.get(result.userId) || `Usuario #${result.userId}`;
        }
      }

      // ✅ NUEVO: Asignar nombres de usuario a respuestas abiertas
      if (stat.openAnswers) {
        for (const openAnswer of stat.openAnswers) {
          for (const answer of openAnswer.answers) {
            answer.userName =
              userMap.get(answer.userId) || `Usuario #${answer.userId}`;
          }
        }
      }
    }
  }
}
