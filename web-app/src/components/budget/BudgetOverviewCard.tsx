import React from 'react'
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { Badge, CurrencyText, Card } from '../ui'
import { BudgetOverviewSkeleton } from '../ui/Skeleton'
import { type BudgetItem, calculateBudgetStats } from './types'

export interface BudgetOverviewCardProps {
  /** Trạng thái loading skeleton */
  isLoading?: boolean
  budgets: BudgetItem[]
  month: number
  year: number
  className?: string
}

export const BudgetOverviewCard: React.FC<BudgetOverviewCardProps> = ({
  isLoading = false,
  budgets,
  month,
  year,
  className = '',
}) => {
  if (isLoading) {
    return <BudgetOverviewSkeleton />
  }

  const calculatedItems = budgets.map(calculateBudgetStats)

  const totalLimit = calculatedItems.reduce((acc, item) => acc + item.budgetLimit, 0)
  const totalSpent = calculatedItems.reduce((acc, item) => acc + item.spent, 0)
  const totalRemaining = totalLimit - totalSpent
  const overallRatio = totalLimit > 0 ? totalSpent / totalLimit : 0
  const overallPercent = Math.floor(overallRatio * 1000) / 10

  const safeCount = calculatedItems.filter((i) => i.status === 'safe').length
  const warningCount = calculatedItems.filter((i) => i.status === 'warning').length
  const exceededCount = calculatedItems.filter((i) => i.status === 'exceeded').length

  const isExceeded = overallRatio >= 1
  const isWarning = overallRatio >= 0.7 && overallRatio < 1

  return (
    <Card
      variant="default"
      className={`rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 ${className}`}
    >
      {/* Tiêu đề & Tổng quan ngân sách */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900 flex items-center justify-center shrink-0 shadow-2xs">
            <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Tổng quan ngân sách Tháng {String(month).padStart(2, '0')}/{year}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-1 sm:line-clamp-none">
              Tổng hợp hạn mức và chi tiêu trong các danh mục đã thiết lập
            </p>
          </div>
        </div>

        {/* Phân bổ trạng thái danh mục - Compact trên mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Badge
            variant="success"
            size="sm"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            {safeCount} An toàn
          </Badge>
          <Badge
            variant="warning"
            size="sm"
            icon={<AlertTriangle className="w-3.5 h-3.5" />}
          >
            {warningCount} Cần chú ý
          </Badge>
          {exceededCount > 0 && (
            <Badge
              variant="danger"
              size="sm"
              icon={<AlertCircle className="w-3.5 h-3.5" />}
            >
              {exceededCount} Vượt mức
            </Badge>
          )}
        </div>
      </div>

      {/* 3 Chỉ số KPI ngân sách tổng - Bố cục tối ưu mobile (2 cột + 1 hero card) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* KPI 1: Tổng hạn mức */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium">
            <Wallet className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="truncate">Tổng hạn mức</span>
          </div>
          <CurrencyText
            amount={totalLimit}
            size="xl"
            className="font-bold font-mono text-slate-900 dark:text-slate-100 truncate"
          />
        </div>

        {/* KPI 2: Tổng đã chi */}
        <div className="p-3 sm:p-4 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700 space-y-0.5 sm:space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 font-medium">
            <TrendingDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
            <span className="truncate">Đã chi tiêu</span>
          </div>
          <CurrencyText
            amount={totalSpent}
            size="xl"
            type={isExceeded ? 'expense' : isWarning ? 'expense' : 'neutral'}
            className={`font-bold font-mono truncate ${
              isExceeded
                ? 'text-rose-600'
                : isWarning
                ? 'text-amber-600'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          />
        </div>

        {/* KPI 3: Số dư ngân sách còn lại (Nổi bật trên mobile: col-span-2) */}
        <div
          className={`col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl border space-y-0.5 sm:space-y-1 ${
            totalRemaining >= 0
              ? 'bg-emerald-50/60 dark:bg-emerald-950/50 border-emerald-200/80 dark:border-emerald-900'
              : 'bg-rose-50/60 dark:bg-rose-950/50 border-rose-200/80 dark:border-rose-900'
          }`}
        >
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium">
            <PiggyBank
              className={`w-3.5 h-3.5 shrink-0 ${
                totalRemaining >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            />
            <span className={totalRemaining >= 0 ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}>
              {totalRemaining >= 0 ? 'Số dư ngân sách còn lại' : 'Ngân sách vượt mức'}
            </span>
          </div>
          <CurrencyText
            amount={Math.abs(totalRemaining)}
            type={totalRemaining >= 0 ? 'income' : 'expense'}
            showSign={totalRemaining < 0}
            size="xl"
            className={`font-extrabold font-mono truncate ${
              totalRemaining >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
            }`}
          />
        </div>
      </div>

      {/* Thanh tiến độ tổng thể - Chữ tiếng Việt font-sans chuẩn typography */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-sans text-slate-600 dark:text-slate-300 font-medium">
            Tỷ lệ sử dụng ngân sách toàn tháng:
          </span>
          <span
            className={`font-bold inline-flex items-center gap-1.5 ${
              isExceeded
                ? 'text-rose-600 dark:text-rose-300'
                : isWarning
                ? 'text-amber-700 dark:text-amber-300'
                : 'text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <span className="font-mono">{overallPercent}%</span>
            <Badge
              variant={isExceeded ? 'danger' : isWarning ? 'warning' : 'success'}
              size="sm"
            >
              {isExceeded ? 'Vượt hạn mức' : isWarning ? 'Cần chú ý' : 'An toàn'}
            </Badge>
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={Math.min(overallPercent, 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${overallPercent}% đã sử dụng`}
          aria-label="Tiến độ sử dụng ngân sách toàn tháng"
          className="h-2.5 sm:h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5"
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExceeded
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(overallPercent, 100)}%` }}
          />
        </div>
      </div>
    </Card>
  )
}
