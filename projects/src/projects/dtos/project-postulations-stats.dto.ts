// Estadística por rol
export class PostulationsByRoleDto {
  roleId: number;
  roleName: string;
  totalPostulations: number;
}

// Respuesta con sus opciones para preguntas de opción múltiple
export class QuestionAnswerDistributionDto {
  questionId: number;
  questionText: string;
  answers: {
    optionId: number;
    optionText: string;
    count: number;
    isCorrect?: boolean;
  }[];
}

// Respuestas abiertas
export class OpenAnswerDto {
  questionId: number;
  questionText: string;
  answers: {
    postulationId: number;
    userId: number;
    answerText: string;
  }[];
}

// Resultado de evaluación por postulación (solo para preguntas con respuesta correcta)
export class PostulationEvaluationResultDto {
  postulationId: number;
  userId: number;
  userName?: string;
  roleId: number;
  correctAnswers: number;
  totalQuestions: number;
  percentage: number;
}

// Estadísticas de evaluaciones por rol
export class RoleEvaluationStatsDto {
  roleId: number;
  roleName: string;
  totalPostulations: number;
  hasQuestionsWithCorrectAnswer: boolean;
  hasEvaluationFile: boolean; // CV o evaluación técnica

  // Solo si hay preguntas con respuesta correcta
  evaluationResults?: PostulationEvaluationResultDto[];

  // Solo si hay preguntas sin respuesta correcta (opción múltiple)
  multipleChoiceDistribution?: QuestionAnswerDistributionDto[];

  // Solo si hay preguntas abiertas
  openAnswers?: OpenAnswerDto[];
}

// DTO principal de estadísticas del proyecto
export class ProjectPostulationsStatsDto {
  projectId: number;
  projectTitle: string;
  totalPostulations: number;
  postulationsByRole: PostulationsByRoleDto[];
  evaluationStatsByRole: RoleEvaluationStatsDto[];
}
