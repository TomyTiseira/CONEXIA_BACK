import { PaginationInfo } from '../../common/utils/pagination.utils';
import { UserInfoDto } from './user-info.dto';

export class CommentWithUserDto {
  id: number;
  content: string;
  userId: number;
  user: UserInfoDto;
  publicationId: number;
  createdAt: Date;
  updatedAt: Date;
}

export class EnhancedCommentsPaginatedDto {
  comments: CommentWithUserDto[];
  pagination: PaginationInfo;
}
