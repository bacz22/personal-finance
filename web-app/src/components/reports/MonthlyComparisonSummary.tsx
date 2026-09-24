import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
} from 'lucide-react'
import { formatVND } from '@/utils/formatters'
import { ReportsSummarySkeleton } from '../ui/Skeleton'
import { Badge, CurrencyText } from '../ui'
import {
  type ComparisonSummaryStats,
  type MonthSelection,
  formatMonthLabel,
} from './types'

export interface MonthlyComparisonSummaryProps {
  /** Trạng thái loading skeleton */
  isLoading?: boolean
  monthA: MonthSelection
  monthB: MonthSelection
  stats: ComparisonSummaryStats
  categoryCount?: number
}

export const MonthlyComparisonSummary: React.FC<MonthlyComparisonSummaryProps> = ({
  isLoading = false,
  monthA,
  monthB,
  stats,
}) => {
  if (isLoading) {
    return <ReportsSummarySkeleton />
  }

  const monthALabel = formatMonthLabel(monthA.month, monthA.year)
  const monthBLabel = formatMonthLabel(monthB.month, monthB.year)
  const monthACode = `${String(monthA.month).padStart(2, '0')}/${monthA.year}`
  const monthBCode = `${String(monthB.month).padStart(2, '0')}/${monthB.year}`

  // Phân tích trạng thái biến động chi tiêu
  // Trong chi tiêu cá nhân:
  // - Tăng chi tiêu (stats.diffAmount > 0): cần chú ý/cảnh báo (Rose/Red)
  // - Giảm chi tiêu / Tiết kiệm (stats.diffAmount < 0): tích cực (Emerald/Green)
  // - Không đổi (stats.diffAmount === 0): trung tính (Slate)
  const isIncreased = stats.diffAmount > 0
  const isDecreased = stats.diffAmount < 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
      {/* CARD 1: TỔNG CHI THÁNG A (KỲ GỐC) */}
      <div
        className="rounded-3xl p-4 sm:p-5 flex flex-col justify-between bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl border border-white/85 dark:border-white/10 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset]"
      >
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <Badge variant="info" size="sm" icon={<Calendar className="w-3 h-3" />} className="whitespace-nowrap">
              {monthACode}
            </Badge>
          </div>

          <div className="mt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tổng chi
            </div>
            <div className="mt-1">
              <CurrencyText
                amount={stats.totalMonthA}
                size="xl"
                className="text-slate-900 dark:text-slate-100 font-black"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 2: TỔNG CHI THÁNG B (KỲ SO SÁNH) */}
      <div
        className="rounded-3xl p-4 sm:p-5 flex flex-col justify-between bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl border border-white/85 dark:border-white/10 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset]"
      >
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <Badge variant="success" size="sm" icon={<Calendar className="w-3 h-3" />} className="whitespace-nowrap">
              {monthBCode}
            </Badge>
          </div>

          <div className="mt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tổng chi
            </div>
            <div className="mt-1">
              <CurrencyText
                amount={stats.totalMonthB}
                size="xl"
                className="text-slate-900 dark:text-slate-100 font-black"
              />
            </div>
          </div>
        </div>
      </div>

      {/* CARD 3: BIẾN ĐỘNG CHI TIÊU (HERO CARD - COL-SPAN-2 MD:COL-SPAN-1) */}
      <div
        className={`col-span-2 md:col-span-1 rounded-3xl p-4 sm:p-5 flex flex-col justify-between backdrop-blur-2xl border ${
          isIncreased
            ? 'bg-gradient-to-br from-rose-500/10 via-white/85 to-white/75 dark:from-rose-950/30 dark:via-slate-900/85 dark:to-slate-900/80 border-rose-300/80 dark:border-rose-500/30 shadow-[0_16px_40px_rgba(244,63,94,0.12),0_0_0_1px_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset]'
            : isDecreased
            ? 'bg-gradient-to-br from-emerald-500/10 via-white/85 to-white/75 dark:from-emerald-950/30 dark:via-slate-900/85 dark:to-slate-900/80 border-emerald-300/80 dark:border-emerald-500/30 shadow-[0_16px_40px_rgba(16,185,129,0.12),0_0_0_1px_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset]'
            : 'bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(15,23,42,0.85)] border-white/85 dark:border-white/10 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset]'
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Biến động chi tiêu
            </span>

            {isIncreased && (
              <Badge variant="expense" size="sm" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                Tăng chi tiêu
              </Badge>
            )}
            {isDecreased && (
              <Badge variant="success" size="sm" icon={<TrendingDown className="w-3.5 h-3.5" />}>
                Tiết kiệm
              </Badge>
            )}
            {!isIncreased && !isDecreased && (
              <Badge variant="neutral" size="sm" icon={<Minus className="w-3.5 h-3.5" />}>
                Cân bằng
              </Badge>
            )}
          </div>

          <div className="mt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Chênh lệch tuyệt đối & %
            </div>
            <div className="flex items-baseline gap-2 sm:gap-2.5 mt-1 flex-wrap">
              <CurrencyText
                amount={stats.diffAmount}
                showSign
                size="xl"
                type={isIncreased ? 'expense' : isDecreased ? 'income' : 'neutral'}
                className="font-black tracking-tight"
              />
              {stats.percentChange !== null ? (
                <span
                  className={`text-sm sm:text-base font-bold tabular-nums ${
                    isIncreased
                      ? 'text-rose-600 dark:text-rose-400'
                      : isDecreased
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-500'
                  }`}
                >
                  ({stats.percentChange > 0 ? `+${stats.percentChange}%` : `${stats.percentChange}%`})
                </span>
              ) : (
                <Badge variant="info" size="sm">
                  Mới phát sinh
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Chú thích thông minh */}
        <div className="mt-3 pt-2.5 border-t border-white/60 dark:border-white/10 text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-medium">
          {isIncreased && (
            <span>
              Chi tiêu {monthBLabel} cao hơn {monthALabel} là{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {formatVND(stats.diffAmount)}
              </strong>
              {stats.highestIncreaseCategory && (
                <> (tăng nhiều nhất ở {stats.highestIncreaseCategory.name})</>
              )}
              .
            </span>
          )}
          {isDecreased && (
            <span>
              Chi tiêu {monthBLabel} tiết kiệm được{' '}
              <strong className="text-slate-900 dark:text-slate-100 font-bold">
                {formatVND(Math.abs(stats.diffAmount))}
              </strong>{' '}
              so với {monthALabel}
              {stats.highestSavingCategory && (
                <> (giảm sâu nhất ở {stats.highestSavingCategory.name})</>
              )}
              .
            </span>
          )}
          {!isIncreased && !isDecreased && (
            <span>Tổng chi tiêu hai tháng hoàn toàn cân bằng.</span>
          )}
        </div>
      </div>
    </div>
  )
}
