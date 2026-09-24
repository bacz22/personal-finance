import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ReceiptText, ArrowRight, Plus } from 'lucide-react'
import { TransactionItem } from './TransactionItem'
import type { Transaction } from '../transactions/types'
import { Button } from '../ui'
import { cn } from '@/utils/cn'

export interface RecentTransactionsProps {
  currentMonth?: number
  currentYear?: number
  transactions?: Transaction[]
  limit?: number
  onViewAll?: () => void
  onAddTransaction?: () => void
  onTransactionClick?: (transaction: Transaction) => void
  className?: string
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  transactions = [],
  limit = 8,
  onViewAll,
  onAddTransaction,
  onTransactionClick,
  className = '',
}) => {
  const navigate = useNavigate()
  const displayedList = transactions.slice(0, limit)
  const isEmpty = displayedList.length === 0
  const handleViewAll = onViewAll || (() => navigate('/transactions'))

  return (
    <div
      className={cn(
        'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4',
        className
      )}
    >
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ReceiptText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
              Giao dịch gần đây
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {isEmpty
                ? 'Không có giao dịch trong kỳ'
                : `${displayedList.length} giao dịch gần nhất trong Tháng ${String(currentMonth).padStart(2, '0')}/${currentYear}`}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleViewAll}
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          title="Xem toàn bộ sổ giao dịch"
        >
          <span>Xem tất cả</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isEmpty ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-3">
            <ReceiptText className="w-7 h-7" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có giao dịch nào
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] mt-1 mb-4">
            Tháng {currentMonth}/{currentYear} chưa ghi nhận khoản thu hoặc chi nào.
          </p>
          {onAddTransaction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddTransaction}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Thêm giao dịch đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800/80 -mx-1 sm:mx-0">
          {displayedList.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              onClick={onTransactionClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
