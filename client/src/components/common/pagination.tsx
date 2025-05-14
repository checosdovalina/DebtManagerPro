import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
}) => {
  // No pagination needed if there's only one page
  if (totalPages <= 1) {
    return (
      <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between text-sm">
        <div>
          {totalItems !== undefined && (
            <p className="text-sm text-gray-700">
              Mostrando{" "}
              <span className="font-medium">{Math.min(itemsPerPage, totalItems)}</span>{" "}
              de <span className="font-medium">{totalItems}</span> resultados
            </p>
          )}
        </div>
      </div>
    );
  }

  // Get the range of pages to display
  const getPageRange = (): (number | "ellipsis")[] => {
    const pageRange: (number | "ellipsis")[] = [];
    const maxPagesToShow = 5; // Maximum number of page buttons to show

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total pages is less than or equal to max pages to show
      for (let i = 1; i <= totalPages; i++) {
        pageRange.push(i);
      }
    } else {
      // Always show the first page
      pageRange.push(1);

      // Calculate the range of pages to show around the current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust the range if the current page is at the beginning or end
      if (currentPage <= 2) {
        endPage = Math.min(4, totalPages - 1);
      } else if (currentPage >= totalPages - 1) {
        startPage = Math.max(2, totalPages - 3);
      }

      // Add ellipsis before the range if needed
      if (startPage > 2) {
        pageRange.push("ellipsis");
      }

      // Add the range of pages
      for (let i = startPage; i <= endPage; i++) {
        pageRange.push(i);
      }

      // Add ellipsis after the range if needed
      if (endPage < totalPages - 1) {
        pageRange.push("ellipsis");
      }

      // Always show the last page
      pageRange.push(totalPages);
    }

    return pageRange;
  };

  const pageRange = getPageRange();

  return (
    <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
      <div>
        {totalItems !== undefined && (
          <p className="text-sm text-gray-700">
            Mostrando{" "}
            <span className="font-medium">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            a{" "}
            <span className="font-medium">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{" "}
            de <span className="font-medium">{totalItems}</span> resultados
          </p>
        )}
      </div>
      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
        <Button
          variant="outline"
          size="sm"
          className="rounded-l-md"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Anterior</span>
        </Button>

        {pageRange.map((page, index) => {
          if (page === "ellipsis") {
            return (
              <Button key={`ellipsis-${index}`} variant="outline" size="sm" disabled className="cursor-default">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            );
          }

          return (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => onPageChange(page as number)}
              className={
                currentPage === page
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : ""
              }
            >
              {page}
            </Button>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="rounded-r-md"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente</span>
        </Button>
      </nav>
    </div>
  );
};
