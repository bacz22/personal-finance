import React from 'react'
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Trash2,
  Pencil,
} from 'lucide-react'
import { Badge, CurrencyText, Card } from '../ui'
import { BudgetCardSkeleton } from '../ui/Skeleton'
import { getCategoryBadgeStyle } from '@/tokens'
import { type BudgetItem, calculateBudgetStats } from './types'

export interface BudgetCardProps {
  /** Trạng thái loading skeleton */
  isLoading?: boolean
  budget: BudgetItem
  className?: string
  onClick?: (budget: BudgetItem) => void
  onDelete?: (budget: BudgetItem) => void
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  isLoading = false,
  budget,
  className = '',
  onClick,
  onDelete,
}) => {
  if (isLoading) {
    return <BudgetCardSkeleton />
  }

  const item = calculateBudgetStats(budget)
  const Icon = item.categoryIcon
  const isExceeded = item.status === 'exceeded'
  const isWarning = item.status === 'warning'

  return (
    <Card
      variant="default"
      className={`group rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between space-y-3.5 sm:space-y-4 ${
        isExceeded
          ? '!border-rose-300 dark:!border-rose-800 hover:!border-rose-400'
          : isWarning
          ? '!border-amber-300 dark:!border-amber-800 hover:!border-amber-400'
          : '!border-slate-200 dark:!border-slate-700 hover:!border-slate-300'
      } ${className}`}
    >
      {/* 1. DÒNG ĐẦU: ICON DANH MỤC + TÊN DANH MỤC + STATUS BADGE KÉP */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={getCategoryBadgeStyle(item.categoryColor)}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate leading-snug">
              {item.categoryName}
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
              Ngân sách danh mục
            </span>
          </div>
        </div>

        {/* Status Badge & Nút xóa ngân sách */}
        <div className="flex items-center gap-1.5 shrink-0">
          {item.status === 'safe' && (
            <Badge variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
              An toàn
            </Badge>
          )}
          {item.status === 'warning' && (
            <Badge variant="warning" size="sm" icon={<AlertTriangle className="w-3.5 h-3.5" />}>
              Sắp chạm giới hạn
            </Badge>
          )}
          {item.status === 'exceeded' && (
            <Badge variant="danger" size="sm" icon={<AlertCircle className="w-3.5 h-3.5" />}>
              Đã vượt hạn mức
            </Badge>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(budget)}
              title="Xóa ngân sách này"
              aria-label={`Xóa ngân sách ${item.categoryName}`}
              className="p-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. DÒNG GIỮA: SỐ ĐÃ CHI / HẠN MỨC & PHẦN TRĂM */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Đã chi tiêu
            </span>
            <CurrencyText
              amount={item.spent}
              size="lg"
              className="font-bold font-mono text-slate-900 dark:text-slate-100 leading-snug"
            />
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
              Hạn mức
            </span>
            <CurrencyText
              amount={item.budgetLimit}
              size="sm"
              className="font-semibold font-mono text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* PROGRESS BAR VỚI MÀU SẮC NGỮ NGHĨA VÀ ĐỘ RỘNG CAP TẠI 100% */}
        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Tiến độ hạn mức</span>
            <span
              className={`font-bold ${
                isExceeded
                  ? 'text-rose-600'
                  : isWarning
                  ? 'text-amber-600'
                  : 'text-emerald-700'
              }`}
            >
              {item.percent}%
            </span>
          </div>

          <div
            role="progressbar"
            aria-valuenow={Math.min(item.percent, 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${item.percent}% đã sử dụng, ${item.statusLabel}`}
            aria-label={`Tiến độ ngân sách ${item.categoryName}`}
            className="h-2.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden p-0.5"
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExceeded
                  ? 'bg-rose-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(item.percent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. DÒNG CUỐI: SỐ TIỀN CÒN LẠI HOẶC VƯỢT QUÁ & HINT CHỈNH SỬA */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
        <span className="text-slate-600 dark:text-slate-300 font-medium">
          {item.remaining >= 0 ? 'Số dư còn lại:' : 'Số tiền vượt mức:'}
        </span>
        <div className="flex items-center">
          <CurrencyText
            amount={Math.abs(item.remaining)}
            type={item.remaining >= 0 ? 'neutral' : 'expense'}
            showSign={false}
            size="xs"
            className={`font-mono font-bold ${
              item.remaining >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600 dark:text-rose-300'
            }`}
          />
        </div>
      </div>
      {onClick && (
        <button
          type="button"
          onClick={() => onClick(budget)}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/70 px-3 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
          aria-label={`Chỉnh sửa hạn mức ngân sách ${item.categoryName}`}
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Chỉnh sửa hạn mức
        </button>
      )}
    </Card>
  )
}
