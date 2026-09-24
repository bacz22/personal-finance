import React from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Utensils,
  Home,
  Car,
  ShoppingBag,
  Film,
  Briefcase,
  Gift,
  MoreHorizontal,
  ArrowDownLeft,
} from 'lucide-react'
import { formatVND } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { CATEGORY_COLORS, FINANCIAL_SEMANTICS, getCategoryBadgeStyle } from '../../tokens'
import type { Transaction } from '../transactions/types'

export type { Transaction } from '../transactions/types'

export interface TransactionItemProps {
  transaction: Transaction
  onClick?: (transaction: Transaction) => void
  className?: string
}

// Icon và màu mặc định theo danh mục (Sử dụng Design Tokens)
const DEFAULT_CATEGORY_STYLES: Record<
  string,
  { icon: LucideIcon; color: string }
> = {
  'Ăn uống': { icon: Utensils, color: CATEGORY_COLORS.food },
  'Nhà cửa & Hóa đơn': { icon: Home, color: CATEGORY_COLORS.housing },
  'Nhà cửa': { icon: Home, color: CATEGORY_COLORS.housing },
  'Đi lại & Xăng xe': { icon: Car, color: CATEGORY_COLORS.transport },
  'Đi lại': { icon: Car, color: CATEGORY_COLORS.transport },
  'Mua sắm': { icon: ShoppingBag, color: CATEGORY_COLORS.shopping },
  'Mua sắm cá nhân': { icon: ShoppingBag, color: CATEGORY_COLORS.shopping },
  'Giải trí': { icon: Film, color: CATEGORY_COLORS.entertainment },
  'Tiền lương': { icon: Briefcase, color: CATEGORY_COLORS.salary },
  'Lương': { icon: Briefcase, color: CATEGORY_COLORS.salary },
  'Thưởng': { icon: Gift, color: CATEGORY_COLORS.bonus },
  'Khác': { icon: MoreHorizontal, color: CATEGORY_COLORS.other },
}

function formatDateVN(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onClick,
  className = '',
}) => {
  const isIncome = transaction.type === 'income'

  // Xác định icon và màu sắc
  const fallback = DEFAULT_CATEGORY_STYLES[transaction.category] || {
    icon: isIncome ? ArrowDownLeft : MoreHorizontal,
    color: isIncome ? FINANCIAL_SEMANTICS.income.text : CATEGORY_COLORS.other,
  }

  const Icon = transaction.categoryIcon || fallback.icon
  const color = transaction.categoryColor || fallback.color

  return (
    <div
      onClick={() => onClick?.(transaction)}
      className={cn(
        'group flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl transition-all duration-150',
        'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200/80 dark:hover:border-slate-700/80',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {/* 1. Left: Icon Container & Transaction Details */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Category Icon Container */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-150 group-hover:scale-105 select-none"
          style={getCategoryBadgeStyle(color)}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Info Column */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate leading-snug">
              {transaction.title}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {transaction.category}
            </span>
            {transaction.account && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="truncate max-w-[120px] text-slate-400 dark:text-slate-500 text-[11px]">
                  {transaction.account}
                </span>
              </>
            )}
            {/* Mobile Date indicator */}
            <span className="sm:hidden text-slate-300 dark:text-slate-600">•</span>
            <span className="sm:hidden text-[11px] text-slate-400 truncate">
              {formatDateVN(transaction.date)}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Right: Date (Desktop) & Amount with Double Encoding */}
      <div className="flex items-center gap-4 shrink-0 text-right">
        {/* Desktop Date Column */}
        <div className="hidden sm:block text-xs text-slate-400 dark:text-slate-500 tabular-nums">
          {formatDateVN(transaction.date)}
        </div>

        {/* Amount with double encoding (+ / - sign + semantic color) */}
        <div
          className={cn(
            'text-sm sm:text-base font-bold tabular-nums whitespace-nowrap flex items-center justify-end gap-0.5',
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-rose-600 dark:text-rose-400'
          )}
        >
          {isIncome ? (
            <>
              <span className="text-xs font-semibold">+</span>
              <span>{formatVND(transaction.amount, false)}</span>
            </>
          ) : (
            <>
              <span className="text-xs font-semibold">-</span>
              <span>{formatVND(transaction.amount, false)}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
