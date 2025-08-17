import { PaginationInfo } from 'src/common/utils/pagination.utils';
import { PostulationResponseDto } from './postulation-response.dto';

export class GetPostulationsByUserResponseDto {
  postulations: PostulationResponseDto[];
  pagination: PaginationInfo;
}
