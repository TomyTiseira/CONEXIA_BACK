import { PaginationInfo } from '../../common/utils/pagination.utils';
import { UserInfoDto } from './user-info.dto';

export class ReactionTypeInfo {
  type: string;
  count: number;
  emoji: string;
}

export class ReactionWithUserDto {
  id: number;
  type: string;
  userId: number;
  user: UserInfoDto;
  createdAt: Date;
}

export class EnhancedReactionsPaginatedDto {
  reactionsCount: number;
  reactionsSummary: ReactionTypeInfo[];
  reactions: ReactionWithUserDto[];
  pagination: PaginationInfo;
}
