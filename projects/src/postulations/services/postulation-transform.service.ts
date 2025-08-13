import { Injectable } from '@nestjs/common';
import { Postulation } from '../entities/postulation.entity';
import { PostulationResponseDto } from '../response/postulation-response.dto';

@Injectable()
export class PostulationTransformService {
  transformToResponseDto(postulation: Postulation): PostulationResponseDto {
    return {
      id: postulation.id,
      userId: postulation.userId,
      projectId: postulation.projectId,
      status: {
        id: postulation.status.id,
        name: postulation.status.name,
        code: postulation.status.code,
      },
      cvUrl: postulation.cvUrl,
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
