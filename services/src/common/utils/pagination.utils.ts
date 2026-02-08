export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

export function calculatePagination(
  total: number,
  params: PaginationParams,
): PaginationInfo {
  const totalNumber = typeof total === 'number' ? total : Number(total);
  const limitNumber =
    typeof params.limit === 'number' ? params.limit : Number(params.limit);
  const pageNumber =
    typeof params.page === 'number' ? params.page : Number(params.page);

  const totalPages = Math.ceil(totalNumber / limitNumber);
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  return {
    currentPage: pageNumber,
    itemsPerPage: limitNumber,
    totalItems: total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? pageNumber + 1 : null,
    previousPage: hasPreviousPage ? pageNumber - 1 : null,
  };
}
