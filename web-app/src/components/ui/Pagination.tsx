import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface PaginationProps {
  /** Trang hiện tại (1-indexed) */
  page: number
  /** Số lượng mục trên mỗi trang (mặc định 10) */
  pageSize?: number
  /** Tổng số mục dữ liệu */
  totalItems: number
  /** Callback khi thay đổi trang */
  onPageChange: (page: number) => void
  /** ClassName bổ sung */
  className?: string
  /** Danh xưng thực thể dữ liệu (mặc định: 'giao dịch') */
  itemLabel?: string
  /** Kiểu hiển thị: 'table' (dưới đáy bảng) hoặc 'standalone' (thẻ độc lập) */
  variant?: 'table' | 'standalone'
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize = 10,
  totalItems,
  onPageChange,
  className = '',
  itemLabel = 'giao dịch',
  variant = 'table',
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const isFirstPage = currentPage <= 1
  const isLastPage = currentPage >= totalPages

  // Thuật toán tạo danh sách số trang thông minh với dấu ba chấm (...)
  const getPageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const pageNumbers = getPageNumbers()

  const containerStyles =
    variant === 'standalone'
      ? 'rounded-3xl border border-white/80 dark:border-slate-700/60 bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-[var(--glass-blur,16px)] shadow-[0_4px_20px_rgba(15,23,42,0.04)] p-3 sm:py-3.5 sm:px-6'
      : 'border-t border-white/60 dark:border-slate-800/60 rounded-b-3xl bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] py-2.5 px-4 sm:py-3.5 sm:px-6'

  return (
    <nav
      role="navigation"
      aria-label="Điều hướng phân trang"
      className={`flex items-center justify-between gap-2 ${containerStyles} ${className}`}
    >
      {/* 1. Thông tin vị trí phân trang */}
      <div className="flex items-center gap-1.5 text-xs select-none">
        {/* Mobile: Frosted badge count */}
        <div className="sm:hidden flex items-center gap-1.5">
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60 font-mono font-bold text-slate-800 dark:text-slate-100 shadow-2xs text-xs">
            {startItem}–{endItem}
          </span>
          <span className="text-slate-400 font-mono text-xs">/</span>
          <span className="font-semibold font-mono text-slate-700 dark:text-slate-300 text-xs">
            {totalItems}
          </span>
        </div>

        {/* Desktop: Câu thông tin đầy đủ */}
        <div className="hidden sm:inline text-slate-500 dark:text-slate-400">
          Hiển thị{' '}
          <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
            {startItem}–{endItem}
          </span>{' '}
          trên{' '}
          <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
            {totalItems}
          </span>{' '}
          {itemLabel}
        </div>
      </div>

      {/* 2. Điều khiển phân trang */}
      <div className="flex items-center justify-end gap-1.5 sm:gap-1.5 shrink-0">
        {/* Nút Previous */}
        <button
          type="button"
          onClick={() => !isFirstPage && onPageChange(currentPage - 1)}
          disabled={isFirstPage}
          aria-label="Chuyển về trang trước"
          className={`w-8.5 h-8.5 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 select-none ${
            isFirstPage
              ? 'text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/50 border border-white/70 dark:border-slate-700/60 cursor-not-allowed shadow-2xs'
              : 'text-slate-800 dark:text-slate-100 bg-white/85 dark:bg-slate-800/85 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 border border-white dark:border-slate-700/70 cursor-pointer shadow-xs active:scale-95 backdrop-blur-md'
          }`}
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.25]" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Desktop: Danh sách các số trang với ellipsis */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  aria-hidden="true"
                  className="w-8.5 h-8.5 flex items-center justify-center text-xs text-slate-400 select-none"
                >
                  •••
                </span>
              )
            }

            const pageNum = Number(p)
            const isActive = pageNum === currentPage

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-label={`Chuyển đến trang ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
                className={`w-8.5 h-8.5 rounded-xl text-xs font-semibold font-mono transition-all flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 select-none ${
                  isActive
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold shadow-[0_3px_10px_rgba(5,150,105,0.35)] border border-emerald-500/50 cursor-default'
                    : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 border border-white/80 dark:border-slate-700/60 cursor-pointer shadow-2xs active:scale-95 backdrop-blur-md'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        {/* Mobile: Pill chỉ số trang dạng Liquid Pill sang trọng "X / Y" */}
        <div className="sm:hidden px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/12 to-teal-500/12 border border-emerald-500/25 flex items-center gap-1 text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 shadow-2xs select-none">
          <span>{currentPage}</span>
          <span className="text-emerald-600/40 font-normal">/</span>
          <span className="text-emerald-700/70 dark:text-emerald-400/70 font-semibold">{totalPages}</span>
        </div>

        {/* Nút Next */}
        <button
          type="button"
          onClick={() => !isLastPage && onPageChange(currentPage + 1)}
          disabled={isLastPage}
          aria-label="Chuyển sang trang tiếp theo"
          className={`w-8.5 h-8.5 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 select-none ${
            isLastPage
              ? 'text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-slate-800/50 border border-white/70 dark:border-slate-700/60 cursor-not-allowed shadow-2xs'
              : 'text-slate-800 dark:text-slate-100 bg-white/85 dark:bg-slate-800/85 hover:bg-white dark:hover:bg-slate-700 hover:text-emerald-600 border border-white dark:border-slate-700/70 cursor-pointer shadow-xs active:scale-95 backdrop-blur-md'
          }`}
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-4 h-4 stroke-[2.25]" />
        </button>
      </div>
    </nav>
  )
}
