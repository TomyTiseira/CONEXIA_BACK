import { Injectable } from '@nestjs/common';
import { Postulation } from '../entities/postulation.entity';
import {
  PostulationAnswerResponseDto,
  PostulationResponseDto,
} from '../response/postulation-response.dto';

@Injectable()
export class PostulationTransformService {
  transformToResponseDto(postulation: Postulation): PostulationResponseDto {
    // Transform answers if they exist
    const answers: PostulationAnswerResponseDto[] = (
      postulation.answers || []
    ).map((answer) => {
      const response: PostulationAnswerResponseDto = {
        questionId: answer.questionId,
        questionText: answer.question?.questionText || '',
      };

      if (answer.answerText) {
        response.answerText = answer.answerText;
      }

      if (answer.optionId) {
        response.selectedOptionId = answer.optionId;
        // Find the option text from the question's options
        const question = postulation.role?.questions?.find(
          (q) => q.id === answer.questionId,
        );
        const option = question?.options?.find((o) => o.id === answer.optionId);
        response.selectedOptionText = option?.optionText || '';
      }

      return response;
    });

    return {
      id: postulation.id,
      userId: postulation.userId,
      projectId: postulation.projectId,
      roleId: postulation.roleId,
      status: {
        id: postulation.status.id,
        name: postulation.status.name,
        code: postulation.status.code,
      },
      cvUrl: postulation.cvUrl,
      cvFilename: postulation.cvFilename,
      answers: answers.length > 0 ? answers : undefined,
      evaluationSubmissionUrl: postulation.evaluationSubmissionUrl,
      evaluationSubmissionFilename: postulation.evaluationSubmissionFilename,
      evaluationSubmissionMimetype: postulation.evaluationSubmissionMimetype,
      evaluationLink: postulation.evaluationLink,
      evaluationDescription: postulation.evaluationDescription,
      evaluationDeadline: postulation.evaluationDeadline,
      evaluationSubmittedAt: postulation.evaluationSubmittedAt,
      investorAmount: postulation.investorAmount,
      investorMessage: postulation.investorMessage,
      partnerDescription: postulation.partnerDescription,
      createdAt: postulation.createdAt,
    };
  }

  transformManyToResponseDto(
    postulations: Postulation[],
  ): PostulationResponseDto[] {
    return postulations.map((postulation) =>
      this.transformToResponseDto(postulation),
    );
  }
}
