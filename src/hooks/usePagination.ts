import { useState, useMemo } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function usePagination<T>(items: T[], pageSize: number = 20) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const state: PaginationState = {
    page,
    pageSize,
    total: items.length,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };

  const goToPage = (newPage: number) => {
    setPage(Math.min(Math.max(1, newPage), totalPages));
  };

  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const firstPage = () => goToPage(1);
  const lastPage = () => goToPage(totalPages);

  return { paginatedItems, state, goToPage, nextPage, prevPage, firstPage, lastPage };
}
