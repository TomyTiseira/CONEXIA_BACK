export class ReactionTypeCount {
  type: string;
  count: number;
}

export class ReactionSummaryDto {
  total: number;
  types: ReactionTypeCount[];
}
