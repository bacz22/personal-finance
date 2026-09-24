import React, { useState, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import {
  BarChart3,
  ArrowUpRight,
  Plus,
  Sparkles,
} from 'lucide-react'
import { formatVND, formatCompactVND } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { Button, Skeleton } from '../ui'
import { CHART_TOKENS, FINANCIAL_SEMANTICS } from '../../tokens'

export interface DailyExpenseItem {
  date: string // YYYY-MM-DD
  day: number // 1 - 31
  amount: number // VND
}

export interface DailyExpenseTrendProps {
  /** Tháng đang xem (1 - 12) */
  currentMonth?: number
  /** Năm đang xem */
  currentYear?: number
  /** Dữ liệu time-series tùy biến nếu có */
  data?: DailyExpenseItem[]
  /** Trạng thái đang tải dữ liệu */
  isLoading?: boolean
  /** Callback mở modal thêm giao dịch */
  onAddTransaction?: () => void
  className?: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: DailyExpenseItem
  }>
  currentMonth: number
  currentYear: number
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  currentMonth,
  currentYear,
}) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload
    const dateObj = new Date(currentYear, currentMonth - 1, item.day)
    const daysOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    const dayName = daysOfWeek[dateObj.getDay()]

    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white text-[11px] rounded-lg px-2.5 py-1 shadow-lg border border-slate-800/80 z-50 select-none pointer-events-none whitespace-nowrap animate-in fade-in-0 zoom-in-95 duration-75">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-slate-200">
            {dayName}, {String(item.day).padStart(2, '0')}/{String(currentMonth).padStart(2, '0')}
          </span>
          <span className="text-slate-500">•</span>
          <span className={cn('font-bold tabular-nums', item.amount > 0 ? 'text-rose-400' : 'text-slate-400')}>
            {item.amount > 0 ? formatVND(item.amount, false) : '0 ₫'}
          </span>
        </div>
      </div>
    )
  }
  return null
}

export const DailyExpenseTrend: React.FC<DailyExpenseTrendProps> = ({
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  data,
  isLoading = false,
  onAddTransaction,
  className = '',
}) => {
  const [activeDay, setActiveDay] = useState<number | null>(null)

  // Số ngày trong tháng
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate()
  }, [currentYear, currentMonth])
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth
  const elapsedDays = isCurrentMonth ? today.getDate() : daysInMonth

  // Dữ liệu time-series được truyền từ API qua props.
  const chartData = useMemo(() => data ?? [], [data])

  // Thống kê tóm tắt
  const { totalExpense, maxExpenseItem, avgExpense, noSpendDaysCount } = useMemo(() => {
    let total = 0
    let elapsedTotal = 0
    let maxItem: DailyExpenseItem = { date: '', day: 1, amount: 0 }
    let zeroDays = 0

    chartData.forEach((item) => {
      total += item.amount
      if (item.amount > maxItem.amount) {
        maxItem = item
      }
      if (item.day <= elapsedDays) {
        elapsedTotal += item.amount
      }
      if (item.day <= elapsedDays && item.amount === 0) {
        zeroDays += 1
      }
    })

    const avg = elapsedDays > 0 ? Math.round(elapsedTotal / elapsedDays) : 0

    return {
      totalExpense: total,
      maxExpenseItem: maxItem,
      avgExpense: avg,
      noSpendDaysCount: zeroDays,
    }
  }, [chartData, elapsedDays])

  // Các mốc tick trên trục X theo MASTER.md (1, 5, 10, 15, 20, 25, ngày cuối tháng)
  const xAxisTicks = useMemo(() => {
    const base = [1, 5, 10, 15, 20, 25]
    if (!base.includes(daysInMonth)) {
      base.push(daysInMonth)
    }
    return base
  }, [daysInMonth])

  // 1. GIAO DIỆN SKELETON KHI ĐANG TẢI (LOADING STATE)
  if (isLoading) {
    return (
      <div
        className={cn(
          'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1.5">
            <Skeleton width="180px" height="20px" />
            <Skeleton width="220px" height="14px" />
          </div>
          <Skeleton width="120px" height="28px" />
        </div>
        <div className="h-[240px] flex items-end justify-between gap-1 sm:gap-2 pt-6 px-2">
          {Array.from({ length: 18 }, (_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-t-md"
              style={{
                height: `${Math.max(25, (Math.sin(i * 0.8) + 1.2) * 60)}px`,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  // 2. GIAO DIỆN KHI KHÔNG CÓ DỮ LIỆU (EMPTY STATE)
  const isEmpty = totalExpense === 0
  if (isEmpty) {
    return (
      <div
        className={cn(
          'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between',
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-rose-500" />
              <span>Xu hướng chi tiêu theo ngày</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Thống kê biến động các khoản chi trong tháng {String(currentMonth).padStart(2, '0')}/{currentYear}
            </p>
          </div>
        </div>

        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-3">
            <BarChart3 className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có dữ liệu xu hướng chi tiêu
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mt-1 mb-4">
            Khi bạn ghi chép chi tiêu trong tháng {currentMonth}/{currentYear}, biểu đồ biến động theo ngày sẽ xuất hiện tại đây.
          </p>
          {onAddTransaction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddTransaction}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Thêm giao dịch ngay
            </Button>
          )}
        </div>
      </div>
    )
  }

  // 3. GIAO DIỆN BIỂU ĐỒ CHÍNH (BAR CHART)
  return (
    <div
      className={cn(
        'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between',
        className
      )}
    >
      {/* Header component */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Xu hướng chi tiêu theo ngày</span>
            <span className="text-xs font-normal text-slate-400">
              (T{String(currentMonth).padStart(2, '0')}/{currentYear})
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Biến động ngân sách chi tiêu từng ngày trong tháng
          </p>
        </div>

        {/* Các chỉ số tóm tắt nhanh (Quick Insight Badges) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Trung bình:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">
              {formatCompactVND(avgExpense)}/ngày
            </span>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40 px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 text-rose-700 dark:text-rose-300">
            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">Cao nhất:</span>
            <span className="font-bold tabular-nums">
              {formatCompactVND(maxExpenseItem.amount)} (N{maxExpenseItem.day})
            </span>
          </div>
        </div>
      </div>

      {/* Canvas Biểu đồ Recharts BarChart */}
      <div className="w-full h-[220px] sm:h-[240px] pt-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            style={{ outline: 'none' }}
            margin={{ top: 12, right: 10, left: -15, bottom: 0 }}
            onMouseMove={(state) => {
              if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                const idx = Number(state.activeTooltipIndex)
                if (!isNaN(idx)) {
                  setActiveDay(idx + 1)
                }
              }
            }}
            onClick={(state) => {
              if (state && state.activeTooltipIndex !== undefined && state.activeTooltipIndex !== null) {
                const idx = Number(state.activeTooltipIndex)
                if (!isNaN(idx)) {
                  setActiveDay((prev) => (prev === idx + 1 ? null : idx + 1))
                }
              }
            }}
            onMouseLeave={() => setActiveDay(null)}
          >
            {/* Lưới grid nhẹ ngang, không gây rối dashboard */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={CHART_TOKENS.grid}
              vertical={false}
            />

            {/* Trục X: Hiển thị ngày 1, 5, 10, 15, 20, 25, cuối tháng */}
            <XAxis
              dataKey="day"
              ticks={xAxisTicks}
              tickLine={false}
              axisLine={{ stroke: CHART_TOKENS.grid }}
              tick={{ fontSize: 11, fill: CHART_TOKENS.text }}
              tickFormatter={(val) => `N${val}`}
            />

            {/* Trục Y: Rút gọn số tiền (500k, 1tr, 2tr...) */}
            <YAxis
              tickLine={false}
              axisLine={false}
              width={45}
              tick={{ fontSize: 10, fill: CHART_TOKENS.text }}
              tickFormatter={(val) => formatCompactVND(val)}
            />

            {/* Tooltip định dạng VND chi tiết */}
            <Tooltip
              content={
                <CustomTooltip
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                />
              }
              cursor={{ fill: 'var(--chart-highlight)', opacity: 0.8 }}
            />

            {/* Đường tham chiếu chi tiêu trung bình ngày (Reference Line) */}
            <ReferenceLine
              y={avgExpense}
              stroke={CHART_TOKENS.axis}
              strokeDasharray="4 4"
            />

            {/* Cột dữ liệu với hiệu ứng hover và màu semantic rose từ Design System */}
            <Bar
              dataKey="amount"
              radius={[4, 4, 0, 0]}
              isAnimationActive={true}
              animationDuration={250}
            >
              {chartData.map((entry) => {
                const isHovered = activeDay === entry.day
                const isMax = entry.day === maxExpenseItem.day
                return (
                  <Cell
                    key={`bar-${entry.day}`}
                    fill={isMax ? FINANCIAL_SEMANTICS.expense.hover : FINANCIAL_SEMANTICS.expense.text}
                    opacity={activeDay === null || isHovered ? 1 : 0.45}
                    style={{
                      transition: 'opacity 0.15s ease, fill 0.15s ease',
                      cursor: 'pointer',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  />
                )
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chú thích chân biểu đồ */}
      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block"></span>
            <span>Chi trong ngày</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-b border-dashed border-slate-400 inline-block"></span>
            <span>Mức trung bình ngày</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
          <Sparkles className="w-3 h-3" />
          <span>{noSpendDaysCount} ngày không phát sinh chi tiêu</span>
        </div>
      </div>
    </div>
  )
}
