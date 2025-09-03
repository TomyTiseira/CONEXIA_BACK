import { PaginationInfo } from '../../common/utils/pagination.utils';
import { PublicationComment } from '../entities/publication-comment.entity';

export class CommentsPaginatedDto {
  comments: PublicationComment[];
  pagination: PaginationInfo;
}
