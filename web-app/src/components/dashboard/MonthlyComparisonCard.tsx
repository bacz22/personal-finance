import React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'
import { formatVND } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export interface CategoryMoverInsight {
  categoryName: string
  icon: LucideIcon
  color: string
  amountDiff: number // Chênh lệch số tiền (+ hoặc -)
  percentDiff: number // Chênh lệch % (+ hoặc -)
  description?: string
}

export interface MonthlyComparisonCardProps {
  /** Tháng hiện tại (1 - 12) */
  currentMonth?: number
  /** Năm hiện tại */
  currentYear?: number
  /** Ghi đè tổng chi tháng hiện tại */
  currentExpense?: number
  /** Ghi đè tổng chi tháng trước */
  previousExpense?: number
  /** Ghi đè insight danh mục tăng */
  topIncreasedCategory?: CategoryMoverInsight
  /** Ghi đè insight danh mục giảm */
  topDecreasedCategory?: CategoryMoverInsight
  className?: string
}

export const MonthlyComparisonCard: React.FC<MonthlyComparisonCardProps> = ({
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  currentExpense: propCurrentExpense,
  previousExpense: propPreviousExpense,
  className = '',
}) => {
  // Xác định tháng trước & năm của tháng trước
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear

  const curExpense = propCurrentExpense ?? 0
  const prevExpense = propPreviousExpense ?? 0

  // Tính chênh lệch
  const diffAmount = curExpense - prevExpense
  const hasZeroPrev = prevExpense === 0

  // Tỷ lệ phần trăm
  const percentChange = !hasZeroPrev
    ? ((Math.abs(diffAmount) / prevExpense) * 100).toFixed(1)
    : '100'

  // Bản chất tài chính:
  // - Nếu chi tiêu tăng (diffAmount > 0): Cảnh báo tăng chi tiêu (Warning)
  // - Nếu chi tiêu giảm (diffAmount < 0): Tốt, đã tiết kiệm (Success)
  const isSpendingMore = diffAmount > 0
  const isSpendingLess = diffAmount < 0

  if (curExpense === 0 && prevExpense === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500">
        Chưa có dữ liệu để so sánh chi tiêu giữa hai tháng.
      </div>
    )
  }

  return (
    <div
      className={cn(
        'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5',
        className
      )}
    >
      {/* 1. Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Scale className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>So sánh với tháng trước</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Biến động ngân sách giữa Tháng {String(currentMonth).padStart(2, '0')}/{currentYear} và Tháng {String(prevMonth).padStart(2, '0')}/{prevYear}
          </p>
        </div>

        {/* Trạng thái tóm tắt (Double Encoding: Icon + Label + Badge) */}
        <div>
          {hasZeroPrev ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 select-none">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kỳ mới phát sinh</span>
            </span>
          ) : isSpendingMore ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 select-none">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Chi nhiều hơn +{percentChange}%</span>
            </span>
          ) : isSpendingLess ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 select-none">
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Tiết kiệm hơn -{percentChange}%</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 select-none">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Tương đương kỳ trước</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Khối so sánh 3 cột: Tháng này vs Tháng trước vs Chênh lệch */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Cột 1: Tháng hiện tại */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Tháng này (T{String(currentMonth).padStart(2, '0')})</span>
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200/60">
              Đang chọn
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            {formatVND(curExpense, false)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tổng thực chi trong kỳ</p>
        </div>

        {/* Cột 2: Tháng trước */}
        <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Tháng trước (T{String(prevMonth).padStart(2, '0')})</span>
            <span className="text-[10px] text-slate-400">Kỳ liền kề</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">
            {formatVND(prevExpense, false)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tổng chi kỳ trước đó</p>
        </div>

        {/* Cột 3: Biến động chênh lệch */}
        <div
          className={cn(
            'p-4 rounded-xl border transition-colors',
            hasZeroPrev
              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/70 dark:border-blue-900/60'
              : isSpendingMore
              ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-900/60'
              : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/60'
          )}
        >
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
            Chênh lệch chi tiêu
          </div>
          <div
            className={cn(
              'text-xl sm:text-2xl font-bold tabular-nums flex items-center gap-1',
              hasZeroPrev
                ? 'text-blue-600 dark:text-blue-400'
                : isSpendingMore
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-emerald-600 dark:text-emerald-400'
            )}
          >
            <span>
              {hasZeroPrev
                ? formatVND(curExpense, false)
                : `${diffAmount > 0 ? '+' : ''}${formatVND(diffAmount, false)}`}
            </span>
          </div>
          <div className="text-[11px] font-medium mt-1 text-slate-500 dark:text-slate-400 flex items-center gap-1">
            {hasZeroPrev ? (
              <span>Tháng trước chưa ghi chép</span>
            ) : isSpendingMore ? (
              <>
                <span className="text-rose-600 font-bold">+{percentChange}%</span>
                <span>so với mức chi tháng trước</span>
              </>
            ) : (
              <>
                <span className="text-emerald-600 font-bold">-{percentChange}%</span>
                <span>so với mức chi tháng trước</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
