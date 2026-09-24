import React from 'react'
import {
  Layers,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { FINANCIAL_SEMANTICS } from '@/tokens'
import { type CategoryType } from './types'

export interface CategoryStatsOverviewProps {
  total: number
  expenseCount: number
  incomeCount: number
  activeCount?: number
  inactiveCount?: number
  selectedType: 'all' | CategoryType
  onTypeChange: (type: 'all' | CategoryType) => void
}

export const CategoryStatsOverview: React.FC<CategoryStatsOverviewProps> = ({
  total,
  expenseCount,
  incomeCount,
  selectedType,
  onTypeChange,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
      {/* CARD 1: TẤT CẢ DANH MỤC */}
      <button
        type="button"
        onClick={() => onTypeChange('all')}
        className={`p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between select-none shadow-2xs hover:shadow-xs ${
          selectedType === 'all'
            ? 'shadow-xs'
            : 'hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        aria-pressed={selectedType === 'all'}
        title="Hiển thị tất cả danh mục"
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">
            Tất cả
          </span>
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 tabular-nums">
            {total}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Danh mục
          </div>
        </div>
      </button>

      {/* CARD 2: DANH MỤC CHI TIÊU */}
      <button
        type="button"
        onClick={() => onTypeChange('expense')}
        className={`p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between select-none shadow-2xs hover:shadow-xs ${
          selectedType === 'expense'
            ? 'shadow-xs'
            : 'hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        aria-pressed={selectedType === 'expense'}
        title="Lọc chỉ danh mục Chi tiêu"
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-rose-600 dark:text-rose-400 truncate">
            Chi tiêu
          </span>
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: FINANCIAL_SEMANTICS.expense.bg,
              color: FINANCIAL_SEMANTICS.expense.text,
            }}
          >
            <TrendingDown className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div
            className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums"
            style={{ color: FINANCIAL_SEMANTICS.expense.text }}
          >
            {expenseCount}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Mục chi
          </div>
        </div>
      </button>

      {/* CARD 3: DANH MỤC THU NHẬP */}
      <button
        type="button"
        onClick={() => onTypeChange('income')}
        className={`p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] text-left transition-all duration-200 cursor-pointer relative group flex flex-col justify-between select-none shadow-2xs hover:shadow-xs ${
          selectedType === 'income'
            ? 'shadow-xs'
            : 'hover:border-slate-300 dark:hover:border-slate-700'
        }`}
        aria-pressed={selectedType === 'income'}
        title="Lọc chỉ danh mục Thu nhập"
      >
        <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
          <span className="text-[11px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
            Thu nhập
          </span>
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{
              backgroundColor: FINANCIAL_SEMANTICS.income.bg,
              color: FINANCIAL_SEMANTICS.income.text,
            }}
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div
            className="text-xl sm:text-2xl font-bold tracking-tight tabular-nums"
            style={{ color: FINANCIAL_SEMANTICS.income.text }}
          >
            {incomeCount}
          </div>
          <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            Mục thu
          </div>
        </div>
      </button>
    </div>
  )
}
