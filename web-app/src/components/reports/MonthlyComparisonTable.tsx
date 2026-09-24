import React from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react'
import { Badge, CurrencyText } from '../ui'
import { TransactionTableSkeleton } from '../ui/Skeleton'
import {
  type CalculatedComparisonRow,
  type MonthSelection,
  type ComparisonSummaryStats,
  formatMonthLabel,
  MONTH_A_COLOR,
  MONTH_B_COLOR,
} from './types'

export interface MonthlyComparisonTableProps {
  /** Trạng thái loading skeleton */
  isLoading?: boolean
  monthA: MonthSelection
  monthB: MonthSelection
  data: CalculatedComparisonRow[]
  stats: ComparisonSummaryStats
}

export const MonthlyComparisonTable: React.FC<MonthlyComparisonTableProps> = ({
  isLoading = false,
  monthA,
  monthB,
  data,
  stats,
}) => {
  if (isLoading) {
    return <TransactionTableSkeleton rowsCount={7} />
  }

  const monthALabel = formatMonthLabel(monthA.month, monthA.year)
  const monthBLabel = formatMonthLabel(monthB.month, monthB.year)

  return (
    <div className="relative rounded-3xl bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl border border-white/85 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] overflow-hidden">
      {/* Table Section Header */}
      <div className="p-4 sm:p-5 border-b border-white/60 dark:border-white/10 bg-gradient-to-b from-white/80 via-white/50 to-white/20 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/20 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/70 dark:bg-slate-800/70 border border-white/90 dark:border-white/15 shadow-[0_2px_6px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md text-emerald-600 dark:text-emerald-400">
              <TableIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Bảng chi tiết so sánh chi tiêu
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Phân bổ chi tiết số tiền, chênh lệch tuyệt đối và tốc độ tăng trưởng theo từng nhóm
          </p>
        </div>

        {/* Legend pills */}
        <div className="w-full sm:w-auto flex items-center justify-center sm:justify-end gap-2 text-xs">
          <Badge variant="info" size="sm" icon={<span className="w-2 h-2 rounded-full bg-blue-500" />}>
            {monthALabel}
          </Badge>
          <span className="text-slate-400 text-xs font-semibold">vs</span>
          <Badge variant="success" size="sm" icon={<span className="w-2 h-2 rounded-full bg-emerald-500" />}>
            {monthBLabel}
          </Badge>
        </div>
      </div>

      {/* 1. DESKTOP / TABLET VIEW (TABLE) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
              <th scope="col" className="py-3.5 px-5">
                Danh mục
              </th>
              <th scope="col" className="py-3.5 px-5 text-right">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: MONTH_A_COLOR }}
                  />
                  {monthALabel}
                </span>
              </th>
              <th scope="col" className="py-3.5 px-5 text-right">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: MONTH_B_COLOR }}
                  />
                  {monthBLabel}
                </span>
              </th>
              <th scope="col" className="py-3.5 px-5 text-right">
                Chênh lệch
              </th>
              <th scope="col" className="py-3.5 px-5 text-right">
                % Thay đổi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/50 dark:divide-white/5">
            {data.map((row) => {
              const Icon = row.categoryIcon

              return (
                <tr
                  key={row.id}
                  className="hover:bg-white/50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  {/* Cột 1: Danh mục */}
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/80 dark:border-white/15 shadow-[0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-md group-hover:scale-105 transition-all"
                        style={{
                          backgroundColor: `${row.categoryColor}18`,
                          color: row.categoryColor,
                        }}
                      >
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {row.categoryName}
                        </div>
                        {row.isNew && (
                          <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            Chưa phát sinh ở kỳ gốc
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Tháng A */}
                  <td className="py-4 px-5 text-right font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    <CurrencyText amount={row.monthAAmount} size="sm" />
                  </td>

                  {/* Cột 3: Tháng B */}
                  <td className="py-4 px-5 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    <CurrencyText amount={row.monthBAmount} size="sm" className="font-bold" />
                  </td>

                  {/* Cột 4: Chênh lệch */}
                  <td className="py-4 px-5 text-right font-bold tabular-nums">
                    <CurrencyText
                      amount={row.diffAmount}
                      showSign
                      size="sm"
                      type={row.isIncreased ? 'expense' : row.isDecreased ? 'income' : 'neutral'}
                      className="font-bold"
                    />
                  </td>

                  {/* Cột 5: % Thay đổi */}
                  <td className="py-4 px-5 text-right">
                    {row.isNew ? (
                      <Badge variant="info" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                        Mới phát sinh
                      </Badge>
                    ) : row.percentChange !== null ? (
                      <Badge
                        variant={row.isIncreased ? 'expense' : row.isDecreased ? 'success' : 'neutral'}
                        size="sm"
                        icon={
                          row.isIncreased ? (
                            <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : row.isDecreased ? (
                            <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                          )
                        }
                      >
                        {row.percentChange > 0 ? `+${row.percentChange}%` : `${row.percentChange}%`}
                      </Badge>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* TOTAL FOOTER ROW */}
          <tfoot>
            <tr className="border-t border-white/70 dark:border-white/15 bg-gradient-to-t from-white/90 via-white/70 to-white/40 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900/40 backdrop-blur-xl font-bold text-sm">
              <td className="py-4 px-5 text-slate-900 dark:text-slate-100 font-black">
                Tổng cộng ({data.length} danh mục)
              </td>
              <td className="py-4 px-5 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                <CurrencyText amount={stats.totalMonthA} size="sm" className="font-semibold" />
              </td>
              <td className="py-4 px-5 text-right text-slate-900 dark:text-slate-100 tabular-nums text-base">
                <CurrencyText amount={stats.totalMonthB} size="md" className="font-bold" />
              </td>
              <td className="py-4 px-5 text-right tabular-nums text-base">
                <CurrencyText
                  amount={stats.diffAmount}
                  showSign
                  size="md"
                  type={stats.isIncreased ? 'expense' : stats.isDecreased ? 'income' : 'neutral'}
                  className="font-black"
                />
              </td>
              <td className="py-4 px-5 text-right">
                {stats.percentChange !== null ? (
                  <Badge
                    variant={stats.isIncreased ? 'expense' : stats.isDecreased ? 'success' : 'neutral'}
                    size="sm"
                    icon={
                      stats.isIncreased ? (
                        <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : stats.isDecreased ? (
                        <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      )
                    }
                  >
                    {stats.percentChange > 0
                      ? `+${stats.percentChange}%`
                      : `${stats.percentChange}%`}
                  </Badge>
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 2. MOBILE CARD VIEW: DỄ ĐỌC, CHUẨN LIQUID GLASS */}
      <div className="md:hidden divide-y divide-white/60 dark:divide-white/10 bg-transparent">
        {data.map((row) => {
          const Icon = row.categoryIcon

          return (
            <div key={row.id} className="p-4 sm:p-4.5 space-y-3 transition-colors hover:bg-white/30 dark:hover:bg-slate-800/30">
              {/* Category & Change Badge Header */}
              <div className="flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  {/* 3D Liquid Gem Badge */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/80 dark:border-white/15 shadow-[0_4px_14px_rgba(0,0,0,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] backdrop-blur-xl"
                    style={{
                      backgroundColor: `${row.categoryColor}18`,
                      color: row.categoryColor,
                    }}
                  >
                    <Icon className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate tracking-tight">
                    {row.categoryName}
                  </h3>
                </div>

                {/* % Change hoặc Mới phát sinh */}
                {row.isNew ? (
                  <Badge variant="info" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                    Mới
                  </Badge>
                ) : row.percentChange !== null ? (
                  <Badge
                    variant={row.isIncreased ? 'expense' : row.isDecreased ? 'success' : 'neutral'}
                    size="sm"
                    icon={
                      row.isIncreased ? (
                        <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : row.isDecreased ? (
                        <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                      )
                    }
                  >
                    {row.percentChange > 0 ? `+${row.percentChange}%` : `${row.percentChange}%`}
                  </Badge>
                ) : null}
              </div>

              {/* Data comparison well in card: Frosted Liquid Glass Well */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-white/90 dark:border-white/10 shadow-[0_2px_10px_rgba(15,23,42,0.03),inset_0_1px_1.5px_rgba(255,255,255,0.9)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] backdrop-blur-md">
                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                    {monthALabel}
                  </div>
                  <div className="mt-1">
                    <CurrencyText amount={row.monthAAmount} size="xs" className="font-semibold text-slate-700 dark:text-slate-300" />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                    {monthBLabel}
                  </div>
                  <div className="mt-1">
                    <CurrencyText amount={row.monthBAmount} size="xs" className="font-bold text-slate-900 dark:text-white" />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    Chênh lệch
                  </div>
                  <div className="mt-1">
                    <CurrencyText
                      amount={row.diffAmount}
                      showSign
                      size="xs"
                      type={row.isIncreased ? 'expense' : row.isDecreased ? 'income' : 'neutral'}
                      className="font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Mobile Total Card: Elevated Liquid Glass Shelf */}
        <div className="p-4 sm:p-5 bg-gradient-to-t from-white/90 via-white/70 to-white/40 dark:from-slate-900/90 dark:via-slate-900/70 dark:to-slate-900/40 border-t border-white/80 dark:border-white/15 backdrop-blur-xl shadow-[0_-4px_20px_rgba(0,0,0,0.02),inset_0_1px_1.5px_rgba(255,255,255,0.95)] space-y-2.5">
          <div className="flex items-center justify-between font-bold text-sm text-slate-900 dark:text-white">
            <span className="font-black tracking-tight text-base">Tổng cộng</span>
            <div className="flex items-center gap-2">
              <CurrencyText
                amount={stats.diffAmount}
                showSign
                size="md"
                type={stats.isIncreased ? 'expense' : stats.isDecreased ? 'income' : 'neutral'}
                className="font-black"
              />
              {stats.percentChange !== null && (
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                    stats.isIncreased
                      ? 'text-rose-600 dark:text-rose-300 bg-rose-500/15 border-rose-300/70 dark:border-rose-500/30'
                      : stats.isDecreased
                      ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/15 border-emerald-300/70 dark:border-emerald-500/30'
                      : 'text-slate-600 dark:text-slate-300 bg-slate-200/50 border-slate-300/60'
                  }`}
                >
                  ({stats.percentChange > 0 ? `+${stats.percentChange}%` : `${stats.percentChange}%`})
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-white/60 dark:border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="font-medium">{monthALabel}:</span>
              <CurrencyText amount={stats.totalMonthA} size="xs" className="font-bold text-slate-800 dark:text-slate-200" />
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-medium">{monthBLabel}:</span>
              <CurrencyText amount={stats.totalMonthB} size="xs" className="font-bold text-slate-900 dark:text-white" />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
