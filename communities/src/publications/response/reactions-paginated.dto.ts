import { PaginationInfo } from '../../common/utils/pagination.utils';
import { PublicationReaction } from '../entities/publication-reaction.entity';
import { ReactionSummaryDto } from './reaction-summary.dto';

export class ReactionsPaginatedDto {
  reactions: PublicationReaction[];
  summary: ReactionSummaryDto;
  pagination: PaginationInfo;
}
