import { PaginationInfo } from '../../common/utils/pagination.utils';
import { PostulationResponseDto } from '../response/postulation-response.dto';

export class GetPostulationsResponseDto {
  postulations: PostulationResponseDto[];
  pagination: PaginationInfo;
}
