import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { formatVND } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export type KPITrendDirection = 'up' | 'down' | 'neutral'
export type KPITrendSentiment = 'positive' | 'negative' | 'neutral'

export interface KPICardProps {
  /** Tiêu đề chỉ số (ví dụ: Tổng thu nhập, Tổng chi tiêu) */
  title: string
  /** Giá trị số tiền (VND) hoặc chuỗi tùy biến (như % tiết kiệm) */
  value: number | string
  /** Nếu true, giá trị số sẽ được format chuẩn VND qua formatVND() */
  isCurrency?: boolean
  /** Dấu hiển thị trước số tiền (+ hoặc -) */
  prefixSign?: '+' | '-'
  /** Icon Lucide tương ứng */
  icon: LucideIcon
  /** Style cho icon và nền icon (semantic) */
  iconVariant?: 'income' | 'expense' | 'balance' | 'savings' | 'neutral'
  /** Biến động so với kỳ trước */
  trend?: {
    value: string
    direction?: KPITrendDirection
    sentiment?: KPITrendSentiment
    label?: string
  }
  /** Thanh tiến độ mini (dành cho chỉ số tiết kiệm hoặc ngân sách) */
  progress?: {
    current: number
    target: number
    label?: string
  }
  /** Tooltip hoặc mô tả ngắn phụ */
  description?: string
  className?: string
}

const iconVariantStyles: Record<
  NonNullable<KPICardProps['iconVariant']>,
  { container: string; icon: string }
> = {
  income: {
    container: 'bg-emerald-500/16 backdrop-blur-sm border border-emerald-500/20',
    icon: 'text-emerald-700',
  },
  expense: {
    container: 'bg-rose-500/16 backdrop-blur-sm border border-rose-500/20',
    icon: 'text-rose-700',
  },
  balance: {
    container: 'bg-blue-500/16 backdrop-blur-sm border border-blue-500/20',
    icon: 'text-blue-700',
  },
  savings: {
    container: 'bg-indigo-500/16 backdrop-blur-sm border border-indigo-500/20',
    icon: 'text-indigo-700',
  },
  neutral: {
    container: 'bg-slate-500/14 backdrop-blur-sm border border-slate-400/25',
    icon: 'text-slate-700',
  },
}

const sentimentStyles: Record<
  KPITrendSentiment,
  { badge: string; icon: string }
> = {
  positive: {
    badge: 'bg-emerald-500/14 backdrop-blur-sm text-emerald-700 border-emerald-500/20',
    icon: 'text-emerald-700',
  },
  negative: {
    badge: 'bg-rose-500/14 backdrop-blur-sm text-rose-700 border-rose-500/20',
    icon: 'text-rose-700',
  },
  neutral: {
    badge: 'bg-white/60 backdrop-blur-sm text-slate-700 border-slate-200/60',
    icon: 'text-slate-500',
  },
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  isCurrency = true,
  prefixSign,
  icon: Icon,
  iconVariant = 'neutral',
  trend,
  progress,
  description,
  className,
}) => {
  const iconStyle = iconVariantStyles[iconVariant]

  // Format hiển thị số liệu
  let formattedValue: string
  if (typeof value === 'number' && isCurrency) {
    formattedValue = formatVND(value, false)
    if (prefixSign) {
      formattedValue = `${prefixSign}${formattedValue}`
    }
  } else {
    formattedValue = String(value)
  }

  return (
    <div
      className={cn(
        'group bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-[28px] p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.10)] transition-all duration-200 flex flex-col justify-between',
        className
      )}
    >
      {/* 1. Header: Label bên trái & Icon container bên phải */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span
          className="text-xs font-semibold text-slate-600 uppercase tracking-wider truncate"
          title={title}
        >
          {title}
        </span>
        <div
          className={cn(
            'w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105',
            iconStyle.container
          )}
        >
          <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', iconStyle.icon)} />
        </div>
      </div>

      {/* 2. Value: Con số tài chính nổi bật nhất, font tabular-nums */}
      <div className="my-1">
        <div
          className="text-xl sm:text-2xl xl:text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums leading-tight truncate"
          title={formattedValue}
        >
          {formattedValue}
        </div>
        {description && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
            {description}
          </p>
        )}
      </div>

      {/* 3. Progress bar (nếu có) */}
      {progress && (
        <div className="mt-2.5 mb-1">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
            <span>{progress.label || 'Tiến độ mục tiêu'}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {Math.min(Math.round((progress.current / progress.target) * 100), 100)}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={Math.min(Math.round((progress.current / progress.target) * 100), 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={progress.label || 'Tiến độ mục tiêu'}
            className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(Math.round((progress.current / progress.target) * 100), 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 4. Footer: Biến động so với kỳ trước khi API cung cấp dữ liệu */}
      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/40 flex items-center gap-2 text-xs flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold px-2 py-0.5 rounded-lg text-[11px] border select-none',
              sentimentStyles[trend.sentiment || 'neutral'].badge
            )}
          >
            {trend.direction === 'up' && (
              <ArrowUpRight className={cn('w-3 h-3 stroke-[2.5]', sentimentStyles[trend.sentiment || 'neutral'].icon)} />
            )}
            {trend.direction === 'down' && (
              <ArrowDownRight className={cn('w-3 h-3 stroke-[2.5]', sentimentStyles[trend.sentiment || 'neutral'].icon)} />
            )}
            {trend.direction === 'neutral' && (
              <Minus className={cn('w-3 h-3 stroke-[2.5]', sentimentStyles[trend.sentiment || 'neutral'].icon)} />
            )}
            <span>{trend.value}</span>
          </span>
          {trend.label && (
            <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
              {trend.label}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
