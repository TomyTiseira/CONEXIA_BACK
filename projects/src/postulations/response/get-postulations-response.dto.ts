import { PaginationInfo } from '../../common/utils/pagination.utils';
import { PostulationResponseDto } from './postulation-response.dto';

export interface RoleInfo {
  id: number;
  title: string;
}

export class GetPostulationsResponseDto {
  postulations: PostulationResponseDto[];
  roles: RoleInfo[];
  pagination: PaginationInfo;
}
