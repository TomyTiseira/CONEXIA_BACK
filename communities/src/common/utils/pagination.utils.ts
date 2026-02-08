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

export function calculateCumulativePagination(
  total: number,
  params: PaginationParams,
): PaginationInfo {
  const totalNumber = typeof total === 'number' ? total : Number(total);
  const limitNumber =
    typeof params.limit === 'number' ? params.limit : Number(params.limit);
  const pageNumber =
    typeof params.page === 'number' ? params.page : Number(params.page);

  // En paginación acumulativa, cada página muestra TODAS las conversaciones hasta esa página
  // Por ejemplo: página 1 = 10 conversaciones, página 2 = 20 conversaciones, etc.
  const totalPages = Math.ceil(totalNumber / limitNumber);
  const hasNextPage = pageNumber < totalPages;
  const hasPreviousPage = pageNumber > 1;

  return {
    currentPage: pageNumber,
    itemsPerPage: pageNumber * limitNumber, // Items mostrados acumulativamente
    totalItems: total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    nextPage: hasNextPage ? pageNumber + 1 : null,
    previousPage: hasPreviousPage ? pageNumber - 1 : null,
  };
}
