import { useState, useMemo } from 'react';
import { Equipment } from '@/lib/validationSchemas';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  items: Equipment[];
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  children: (items: Equipment[], pageInfo: PageInfo) => React.ReactNode;
}

export interface PageInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Componente genérico de paginação
 */
export function Paginated({
  items,
  itemsPerPage = 20,
  onPageChange,
  children,
}: PaginationProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const pageInfo = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startIndex,
      endIndex,
      paginatedItems,
    };
  }, [items, itemsPerPage, currentPage]);

  const handlePrevious = () => {
    if (pageInfo.currentPage > 1) {
      const newPage = pageInfo.currentPage - 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleNext = () => {
    if (pageInfo.currentPage < pageInfo.totalPages) {
      const newPage = pageInfo.currentPage + 1;
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  };

  const handleGoToPage = (page: number) => {
    if (page >= 1 && page <= pageInfo.totalPages) {
      setCurrentPage(page);
      onPageChange?.(page);
    }
  };

  return (
    <div className="space-y-4">
      {/* Content */}
      {children(pageInfo.paginatedItems, pageInfo)}

      {/* Pagination Controls */}
      {pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Exibindo{' '}
            <span className="font-medium">
              {pageInfo.startIndex + 1}-{pageInfo.endIndex}
            </span>{' '}
            de <span className="font-medium">{pageInfo.totalItems}</span> itens
          </div>

          <div className="flex items-center gap-2">
            {/* Previous button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handlePrevious}
              disabled={pageInfo.currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft size={16} />
              Anterior
            </Button>

            {/* Page numbers */}
            <div className="flex gap-1">
              {Array.from({ length: pageInfo.totalPages }, (_, i) => i + 1).map(page => {
                // Show first page, last page, current page, and pages around current
                const isVisible =
                  page === 1 ||
                  page === pageInfo.totalPages ||
                  Math.abs(page - pageInfo.currentPage) <= 1;

                if (!isVisible) {
                  if (page === 2 || page === pageInfo.totalPages - 1) {
                    return <span key={`dots-${page}`}>...</span>;
                  }
                  return null;
                }

                return (
                  <Button
                    key={page}
                    size="sm"
                    variant={page === pageInfo.currentPage ? 'default' : 'outline'}
                    onClick={() => handleGoToPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>

            {/* Next button */}
            <Button
              size="sm"
              variant="outline"
              onClick={handleNext}
              disabled={pageInfo.currentPage === pageInfo.totalPages}
              className="flex items-center gap-1"
            >
              Próxima
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Items per page selector */}
          <select
            onChange={e => {
              // This would require prop drilling - left as future improvement
              console.log('Items per page:', e.target.value);
            }}
            className="px-2 py-1 text-sm border rounded"
            defaultValue={itemsPerPage}
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      )}
    </div>
  );
}

/**
 * Hook customizado para paginação
 */
export function usePagination(items: Equipment[], itemsPerPage: number = 20) {
  const [currentPage, setCurrentPage] = useState(1);

  const pageInfo = useMemo(() => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      startIndex,
      endIndex,
      paginatedItems,
    };
  }, [items, itemsPerPage, currentPage]);

  return {
    ...pageInfo,
    goToPage: setCurrentPage,
    nextPage: () => {
      if (currentPage < pageInfo.totalPages) {
        setCurrentPage(currentPage + 1);
      }
    },
    previousPage: () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    },
  };
}
