import React from 'react'
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react'
import { KPICard } from './KPICard'
import { KPICardSkeleton } from '../ui/Skeleton'
import { formatVND } from '@/utils/formatters'

export interface DashboardKPICardsProps {
  /** Trạng thái loading skeleton */
  isLoading?: boolean
  /** Tháng đang xem (1 - 12) */
  currentMonth?: number
  /** Năm đang xem */
  currentYear?: number
  /** Ghi đè số liệu nếu có dữ liệu từ state/API */
  income?: number
  expense?: number
  balance?: number
  savingsRate?: number | null
  className?: string
}

export const DashboardKPICards: React.FC<DashboardKPICardsProps> = ({
  isLoading = false,
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  income: propIncome,
  expense: propExpense,
  balance: propBalance,
  savingsRate: propSavingsRate,
  className = '',
}) => {
  if (isLoading) {
    return (
      <section aria-label="Đang tải chỉ số tài chính..." className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
          <KPICardSkeleton />
        </div>
      </section>
    )
  }

  const totalIncome = propIncome ?? 0
  const totalExpense = propExpense ?? 0
  const netBalance = propBalance ?? totalIncome - totalExpense

  // Tính tỷ lệ tiết kiệm = ((Thu - Chi) / Thu) * 100
  const calculatedSavingsRate =
    totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : null
  const savingsRateVal =
    propSavingsRate !== undefined ? propSavingsRate : calculatedSavingsRate
  const savingsRateLabel = savingsRateVal === null ? '—' : `${savingsRateVal.toFixed(1)}%`

  const isZeroData = totalIncome === 0 && totalExpense === 0

  return (
    <section aria-label="Chỉ số tài chính tổng quan (KPI Cards)" className={className}>
      {/* ========================================================================= */}
      {/* 1. MOBILE HERO BALANCE + QUICK 2-COL STATS (< sm) */}
      {/* ========================================================================= */}
      <div className="block sm:hidden">
        <div className="bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-[24px] p-4.5 border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
          {/* Top row: Icon, Label, Trend badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/16 text-blue-700 flex items-center justify-center border border-blue-500/20 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block leading-tight">
                  Số dư ròng
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {isZeroData ? 'Chưa phát sinh' : `Tháng ${String(currentMonth).padStart(2, '0')}/${currentYear}`}
                </span>
              </div>
            </div>

          </div>

          {/* Large Net Balance Value */}
          <div className="mt-3">
            <span className={`text-2xl font-extrabold tracking-tight ${
              netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
            }`}>
              {formatVND(netBalance, netBalance > 0)}
            </span>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 dark:border-slate-800 my-3" />

          {/* 2-Column Split: Thu nhập & Chi tiêu */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Thu nhập */}
            <div className="p-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/15">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Thu nhập</span>
              </div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300 truncate">
                {formatVND(totalIncome, true)}
              </p>
            </div>

            {/* Chi tiêu */}
            <div className="p-2.5 rounded-xl bg-rose-500/8 border border-rose-500/15">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 mb-0.5">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Chi tiêu</span>
              </div>
              <p className="text-sm font-bold text-rose-800 dark:text-rose-300 truncate">
                {formatVND(totalExpense, false)}
              </p>
            </div>
          </div>

          {/* Savings Rate Progress */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
              <PiggyBank className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Tỷ lệ tiết kiệm:</span>
              <strong className="text-indigo-700 dark:text-indigo-300 font-bold">{savingsRateLabel}</strong>
            </div>
            {savingsRateVal !== null && (
              <div className="w-24 h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, (savingsRateVal / 20) * 100))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLET & DESKTOP 4-COLUMN KPI CARDS (>= sm) */}
      {/* ========================================================================= */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* CARD 1: TỔNG THU */}
        <KPICard
          title="Tổng thu nhập"
          value={totalIncome}
          isCurrency={true}
          prefixSign="+"
          icon={TrendingUp}
          iconVariant="income"
          description={isZeroData ? 'Chưa có phát sinh' : `Kỳ T${String(currentMonth).padStart(2, '0')}/${currentYear}`}
        />

        {/* CARD 2: TỔNG CHI */}
        <KPICard
          title="Tổng chi tiêu"
          value={totalExpense}
          isCurrency={true}
          prefixSign="-"
          icon={TrendingDown}
          iconVariant="expense"
          description={isZeroData ? 'Chưa có phát sinh' : `Kỳ T${String(currentMonth).padStart(2, '0')}/${currentYear}`}
        />

        {/* CARD 3: SỐ DƯ RÒNG */}
        <KPICard
          title="Số dư ròng"
          value={netBalance}
          isCurrency={true}
          icon={Wallet}
          iconVariant="balance"
          description={
            isZeroData
              ? 'Chưa có biến động'
              : netBalance >= 0
                ? 'Dòng tiền dương an toàn'
                : 'Cần kiểm soát thâm hụt'
          }
        />

        {/* CARD 4: TỶ LỆ TIẾT KIỆM */}
        <KPICard
          title="Tỷ lệ tiết kiệm"
          value={savingsRateLabel}
          isCurrency={false}
          icon={PiggyBank}
          iconVariant="savings"
          description={isZeroData ? 'Chưa có phát sinh' : 'Tỷ lệ tích lũy trên thu nhập'}
          progress={
            isZeroData || savingsRateVal === null
              ? undefined
              : {
                  current: savingsRateVal,
                  target: 20,
                  label: 'Mục tiêu khuyến nghị >= 20%',
                }
          }
          trend={
            isZeroData || savingsRateVal === null
              ? undefined
              : {
                  value: savingsRateVal >= 20 ? 'Đạt mục tiêu' : 'Dưới chỉ tiêu',
                  direction: savingsRateVal >= 20 ? 'up' : 'down',
                  sentiment: savingsRateVal >= 20 ? 'positive' : 'negative',
                  label: 'tháng này',
                }
          }
        />
      </div>
    </section>
  )
}
