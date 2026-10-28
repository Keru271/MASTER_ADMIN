"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export interface TablePaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemName?: string;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = "items",
  className = "",
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  // Generate page numbers with ellipsis windowing
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (safePage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-800 bg-slate-950/80 text-xs font-semibold select-none ${className}`}
    >
      {/* Left side: Item count info & optional page size selector */}
      <div className="flex flex-wrap items-center gap-3 text-slate-400">
        <span>
          Showing <strong className="text-slate-100">{startItem}</strong> –{" "}
          <strong className="text-slate-100">{endItem}</strong> of{" "}
          <strong className="text-slate-100">{totalItems}</strong> {itemName}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg border border-slate-800 bg-slate-900 text-slate-200 text-xs font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Page navigation controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safePage <= 1}
          title="First Page"
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          title="Previous Page"
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 px-1">
          {pages.map((p, idx) => {
            if (p === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-500 font-bold text-xs"
                >
                  •••
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === safePage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs shadow-indigo-600/30"
                    : "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
          title="Next Page"
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={safePage >= totalPages}
          title="Last Page"
          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
