import React from 'react'
import {
  Eye,
  Pencil,
  Trash2,
  SearchX,
  TrendingUp,
  TrendingDown,
  Receipt,
  Tag,
} from 'lucide-react'
import {
  Pagination,
  TransactionTableSkeleton,
  EmptyState,
  Badge,
  CurrencyText,
  Button,
} from '../ui'
import { countActiveFilters, type Transaction, type TransactionFilters } from './types'
import { getCategoryBadgeStyle } from '../../tokens'

export interface TransactionTableProps {
  /** Trạng thái loading skeleton */
  isLoading?: boolean
  transactions?: Transaction[]
  filters?: TransactionFilters
  onView?: (transaction: Transaction) => void
  onEdit?: (transaction: Transaction) => void
  onDelete?: (transaction: Transaction) => void
  onResetFilters?: () => void
  onAddTransaction?: () => void
  className?: string
  /** Trang hiện tại (mặc định 1) */
  page?: number
  /** Kích thước trang (mặc định 10) */
  pageSize?: number
  /** Tổng số giao dịch */
  totalItems?: number
  /** Callback chuyển trang */
  onPageChange?: (page: number) => void
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  isLoading = false,
  transactions = [],
  filters,
  onView,
  onEdit,
  onDelete,
  onResetFilters,
  onAddTransaction,
  className = '',
  page = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
}) => {
  const totalResultCount = totalItems ?? transactions.length
  const hasActiveFilters = filters ? countActiveFilters(filters) > 0 : false
  const pageTransactions = transactions

  if (isLoading) {
    return <TransactionTableSkeleton rowsCount={6} />
  }

  // 1. TRƯỜNG HỢP 1: NGƯỜI DÙNG CHƯA TỪNG CÓ GIAO DỊCH NÀO (EMPTY DATA) - DÙNG EMPTYSTATE DÙNG CHUNG
  if (totalResultCount === 0 && !hasActiveFilters) {
    return (
      <EmptyState
        icon={Receipt}
        title="Chưa có giao dịch nào"
        description="Danh sách giao dịch sẽ hiển thị sau khi dữ liệu được tải từ API."
        actionLabel={onAddTransaction ? 'Thêm giao dịch đầu tiên' : undefined}
        onAction={onAddTransaction}
        className={className}
      />
    )
  }

  // 2. TRƯỜNG HỢP 2: KHÔNG TÌM THẤY KẾT QUẢ DO BỘ LỌC (NO FILTER MATCH) - DÙNG EMPTYSTATE DÙNG CHUNG
  if (totalResultCount === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Không tìm thấy giao dịch phù hợp"
        description="Không có giao dịch nào khớp với bộ lọc đang chọn. Hãy thử thay đổi từ khóa tìm kiếm hoặc xóa các tiêu chí lọc."
        actionLabel={onResetFilters ? 'Xóa bộ lọc tìm kiếm' : undefined}
        onAction={onResetFilters}
        className={className}
      />
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ========================================================================= */}
      {/* 1. DESKTOP VIEW: BẢNG DỮ LIỆU ĐẦY ĐỦ CÁC CỘT (md:table) */}
      {/* ========================================================================= */}
      <div className="hidden md:block rounded-3xl border border-white/80 dark:border-slate-700/60 bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-2xl shadow-[0_8px_30px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Header thanh danh sách: Hiển thị số giao dịch trên trang hiện tại */}
        <div className="px-6 py-4 border-b border-white/60 dark:border-slate-800/60 flex items-center justify-between bg-white/30 dark:bg-slate-800/30">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Danh sách giao dịch
            </h2>
            <Badge
              variant="neutral"
              size="sm"
              className="rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60 font-mono text-slate-700 dark:text-slate-300"
            >
              {totalResultCount}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">
            Sắp xếp theo ngày mới nhất
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/40 dark:bg-slate-800/40 border-b border-white/60 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 text-[11px] font-semibold uppercase tracking-wider select-none">
                <th scope="col" className="py-3.5 px-5 font-semibold">Ngày</th>
                <th scope="col" className="py-3.5 px-5 font-semibold">Nội dung</th>
                <th scope="col" className="py-3.5 px-5 font-semibold">Danh mục</th>
                <th scope="col" className="py-3.5 px-5 font-semibold">Loại</th>
                <th scope="col" className="py-3.5 px-5 text-right font-semibold">Số tiền</th>
                <th scope="col" className="py-3.5 px-5 text-right font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60 dark:divide-slate-800/60 text-sm">
              {pageTransactions.map((tx) => {
                const Icon = tx.categoryIcon || Tag
                const isIncome = tx.type === 'income'

                return (
                  <tr
                    key={tx.id}
                    className="hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    {/* Cột 1: Ngày (Dễ scan, font mono sạch sẽ) */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-xs font-mono font-medium text-slate-600 dark:text-slate-400">
                      {formatDateVN(tx.date)}
                    </td>

                    {/* Cột 2: Nội dung & Ghi chú */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1">
                        {tx.title}
                      </div>
                      {tx.note && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[280px]">
                          {tx.note}
                        </div>
                      )}
                    </td>

                    {/* Cột 3: Danh mục (Icon nhỏ + tên) */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border border-white/80 dark:border-slate-700/60 shadow-2xs"
                          style={getCategoryBadgeStyle(tx.categoryColor || '#64748B')}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {tx.category}
                        </span>
                      </div>
                    </td>

                    {/* Cột 4: Loại giao dịch (Dùng Badge dùng chung) */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {isIncome ? (
                        <Badge variant="income" size="sm" icon={<TrendingUp className="w-3 h-3" />}>
                          + Thu nhập
                        </Badge>
                      ) : (
                        <Badge variant="expense" size="sm" icon={<TrendingDown className="w-3 h-3" />}>
                          - Chi tiêu
                        </Badge>
                      )}
                    </td>

                    {/* Cột 5: Số tiền (Dùng CurrencyText dùng chung) */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <CurrencyText
                        amount={tx.amount}
                        type={isIncome ? 'income' : 'expense'}
                        showSign
                        size="sm"
                        className="font-bold font-mono"
                      />
                    </td>

                    {/* Cột 6: Thao tác */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-right">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onView?.(tx)}
                          aria-label={`Xem chi tiết giao dịch ${tx.title}`}
                          title="Xem chi tiết"
                          className="!p-1.5 !min-w-[32px] !min-h-[32px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 rounded-xl"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit?.(tx)}
                          aria-label={`Chỉnh sửa giao dịch ${tx.title}`}
                          title="Chỉnh sửa"
                          className="!p-1.5 !min-w-[32px] !min-h-[32px] text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete?.(tx)}
                          aria-label={`Xóa giao dịch ${tx.title}`}
                          title="Xóa giao dịch"
                          className="!p-1.5 !min-w-[32px] !min-h-[32px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Desktop Pagination */}
        {onPageChange && (
          <Pagination
            page={page}
            pageSize={pageSize}
            totalItems={totalResultCount}
            onPageChange={onPageChange}
          />
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MOBILE VIEW: DANH SÁCH THẺ GỌN TÁCH BIỆT (md:hidden) */}
      {/* ========================================================================= */}
      <div className="md:hidden space-y-3">
        {/* Header danh sách giao dịch mobile */}
        <div className="flex items-center justify-between px-1 py-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Danh sách giao dịch
            </h2>
            <Badge
              variant="neutral"
              size="sm"
              className="rounded-full bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60 font-mono text-slate-700 dark:text-slate-300"
            >
              {totalResultCount}
            </Badge>
          </div>
          <span className="text-xs text-slate-400">
            Sắp xếp theo ngày mới nhất
          </span>
        </div>

        {/* Danh sách thẻ giao dịch nổi riêng biệt */}
        <div className="space-y-3">
          {pageTransactions.map((tx) => {
            const Icon = tx.categoryIcon || Tag
            const isIncome = tx.type === 'income'

            return (
              <div
                key={tx.id}
                className="group relative bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-[var(--glass-blur,16px)] rounded-3xl border border-white/80 dark:border-slate-700/60 p-4 space-y-3 shadow-[0_4px_20px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)] hover:border-white transition-all active:scale-[0.99]"
              >
                {/* Dòng 1: Icon + Tên giao dịch + Số tiền */}
                <div
                  onClick={() => onView?.(tx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onView?.(tx)
                    }
                  }}
                  className="flex items-start justify-between gap-3 cursor-pointer select-none active:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-white/80 dark:border-slate-700/50"
                      style={getCategoryBadgeStyle(tx.categoryColor || '#64748B')}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                        {tx.title}
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono">{formatDateVN(tx.date)}</span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[140px] text-slate-400">{tx.note}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Số tiền căn phải */}
                  <div className="text-right shrink-0">
                    <CurrencyText
                      amount={tx.amount}
                      type={isIncome ? 'income' : 'expense'}
                      showSign
                      size="sm"
                      className="font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Dòng 2: Badges (Danh mục & Loại) + Thao tác sửa/xóa */}
                <div className="flex items-center justify-between pt-2.5 border-t border-white/60 dark:border-slate-800/60">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      variant="neutral"
                      size="sm"
                      className="rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700/60"
                    >
                      {tx.category}
                    </Badge>
                    {isIncome ? (
                      <Badge variant="income" size="sm" icon={<TrendingUp className="w-2.5 h-2.5" />}>
                        + Thu
                      </Badge>
                    ) : (
                      <Badge variant="expense" size="sm" icon={<TrendingDown className="w-2.5 h-2.5" />}>
                        - Chi
                      </Badge>
                    )}
                  </div>

                  {/* Thao tác mobile: Chỉnh sửa và Xóa */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.(tx)
                      }}
                      aria-label={`Chỉnh sửa giao dịch ${tx.title}`}
                      title="Chỉnh sửa"
                      className="w-8 h-8 text-slate-400 hover:text-emerald-600 hover:bg-white/80 dark:hover:bg-slate-800/80 active:bg-emerald-100 rounded-xl border border-transparent hover:border-white/80"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.(tx)
                      }}
                      aria-label={`Xóa giao dịch ${tx.title}`}
                      title="Xóa giao dịch"
                      className="w-8 h-8 text-slate-400 hover:text-rose-600 hover:bg-white/80 dark:hover:bg-slate-800/80 active:bg-rose-100 rounded-xl border border-transparent hover:border-white/80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Mobile Pagination Card */}
        {onPageChange && (
          <Pagination
            variant="standalone"
            page={page}
            pageSize={pageSize}
            totalItems={totalResultCount}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  )
}
