export class PostulationStatusResponseDto {
  id: number;
  name: string;
  code: string;
}

export class PostulationAnswerResponseDto {
  questionId: number;
  questionText: string;
  answerText?: string;
  selectedOptionId?: number;
  selectedOptionText?: string;
}

export class PostulationResponseDto {
  id: number;
  userId: number;
  projectId: number;
  roleId?: number;
  status: PostulationStatusResponseDto;
  cvUrl?: string;
  cvFilename?: string;
  answers?: PostulationAnswerResponseDto[];
  evaluationSubmissionUrl?: string;
  evaluationSubmissionFilename?: string;
  evaluationSubmissionMimetype?: string;
  evaluationLink?: string;
  evaluationDescription?: string;
  evaluationDeadline?: Date;
  evaluationSubmittedAt?: Date;
  investorAmount?: number;
  investorMessage?: string;
  partnerDescription?: string;
  createdAt: Date;
}
