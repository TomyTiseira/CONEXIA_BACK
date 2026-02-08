import { PaginationInfo } from '../../common/utils/pagination.utils';
import { PublicationWithOwnerDto } from './publication-with-owner.dto';

export class PublicationsPaginatedDto {
  publications: PublicationWithOwnerDto[];
  pagination: PaginationInfo;
}
