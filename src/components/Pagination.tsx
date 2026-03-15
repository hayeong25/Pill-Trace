'use client';

import { memo } from 'react';

interface PaginationProps {
  currentPage: number;
  totalCount: number;
  numOfRows: number;
  onPageChange: (page: number) => void;
}

export default memo(function Pagination({ currentPage, totalCount, numOfRows, onPageChange }: PaginationProps) {
  const totalPages = numOfRows > 0 ? Math.ceil(totalCount / numOfRows) : 0;

  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const startItem = Math.min((currentPage - 1) * numOfRows + 1, totalCount);
  const endItem = Math.min(currentPage * numOfRows, totalCount);

  return (
    <div className="mt-8 space-y-3">
      <p className="text-center text-xs text-gray-400">
        총 {totalCount.toLocaleString()}건 중 {startItem.toLocaleString()}~{endItem.toLocaleString()}건
      </p>
      <nav className="flex items-center justify-center gap-1.5" aria-label={`페이지 이동 (${currentPage}/${totalPages})`}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="이전 페이지"
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {start > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              aria-label="첫 페이지"
              className="w-10 h-10 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              1
            </button>
            {start > 2 && <span className="px-1 text-gray-300" aria-hidden="true">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={page === currentPage}
            aria-label={`${page} 페이지`}
            aria-current={page === currentPage ? 'page' : undefined}
            className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
              page === currentPage
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 cursor-default'
                : 'border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ))}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="px-1 text-gray-300" aria-hidden="true">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              aria-label="마지막 페이지"
              className="w-10 h-10 rounded-xl border border-gray-200 text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="다음 페이지"
          className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>
    </div>
  );
});
