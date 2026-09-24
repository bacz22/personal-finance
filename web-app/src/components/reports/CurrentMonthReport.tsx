import React, { useState, useMemo } from 'react'
import {
  Wallet,
  CalendarClock,
  TrendingUp,
  Layers,
  PieChart as PieChartIcon,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { Card, Badge, Button, CurrencyText, DatePicker } from '../ui'
import { cn } from '@/utils/cn'
import { type MonthSelection, formatMonthLabel } from './types'

export interface ReportCategoryData {
  id: string
  name: string
  color: string
  icon: React.ComponentType<{ className?: string }>
  amount: number
}

export interface ReportDailyExpenseData {
  day: number
  amount: number
}

export interface CurrentMonthReportProps {
  initialMonth?: MonthSelection
  month?: MonthSelection
  onMonthChange?: (month: MonthSelection) => void
  data?: ReportCategoryData[]
  totalExpense?: number
  dailyExpenses?: ReportDailyExpenseData[]
  isLoading?: boolean
  error?: string | null
  onRetry?: () => void
}

export const CurrentMonthReport: React.FC<CurrentMonthReportProps> = ({
  initialMonth = { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
  month: controlledMonth,
  onMonthChange,
  data = [],
  totalExpense: propTotalExpense,
  dailyExpenses = [],
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const [internalMonth, setInternalMonth] = useState<MonthSelection>(initialMonth)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null)
  const selectedMonth = controlledMonth ?? internalMonth

  const handleMonthChange = (month: number, year: number) => {
    const nextMonth = { month, year }
    if (!controlledMonth) setInternalMonth(nextMonth)
    onMonthChange?.(nextMonth)
  }

  // Danh sách chi tiêu các danh mục trong tháng
  const monthData = useMemo(() => data, [data])

  // Tổng chi tiêu
  const computedTotalExpense = useMemo(() => {
    return monthData.reduce((sum, item) => sum + item.amount, 0)
  }, [monthData])
  const totalExpense = propTotalExpense ?? computedTotalExpense

  // Số ngày trong tháng
  const daysInMonth = useMemo(() => {
    return new Date(selectedMonth.year, selectedMonth.month, 0).getDate()
  }, [selectedMonth])

  const now = new Date()
  const monthOrdinal = selectedMonth.year * 12 + selectedMonth.month
  const currentMonthOrdinal = now.getFullYear() * 12 + now.getMonth() + 1
  const isCurrentMonth = monthOrdinal === currentMonthOrdinal
  const isFutureMonth = monthOrdinal > currentMonthOrdinal
  const daysToCount = isCurrentMonth ? now.getDate() : isFutureMonth ? 0 : daysInMonth

  // Bình quân và ngày chưa chi của tháng hiện tại chỉ tính đến hôm nay.
  const expensesInElapsedDays = isCurrentMonth
    ? dailyExpenses
        .filter((item) => item.day <= daysToCount)
        .reduce((sum, item) => sum + item.amount, 0)
    : totalExpense
  const dailyAverage = daysToCount > 0 ? expensesInElapsedDays / daysToCount : 0
  const daysWithExpense = dailyExpenses.filter((item) => item.day <= daysToCount && item.amount > 0).length
  const daysWithoutExpense = Math.max(0, daysToCount - daysWithExpense)

  // Sắp xếp danh mục theo chi tiêu giảm dần
  const sortedCategories = useMemo(() => {
    return [...monthData].sort((a, b) => b.amount - a.amount)
  }, [monthData])

  // Danh mục chi nhiều nhất
  const highestCategory = sortedCategories.length > 0 && sortedCategories[0].amount > 0 ? sortedCategories[0] : null

  // Số danh mục phát sinh
  const activeCount = monthData.filter((i) => i.amount > 0).length

  // Dữ liệu cho biểu đồ Donut (chỉ lấy các danh mục > 0)
  const chartData = useMemo(() => {
    return monthData
      .filter((i) => i.amount > 0)
      .map((item) => ({
        ...item,
        percent: totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0,
      }))
  }, [monthData, totalExpense])

  // Danh mục đang được chọn/hover để hiển thị ở tâm biểu đồ
  const activeCategory = useMemo(() => {
    if (!activeCategoryId) return null
    return chartData.find((c) => c.id === activeCategoryId) || null
  }, [activeCategoryId, chartData])

  const monthLabel = formatMonthLabel(selectedMonth.month, selectedMonth.year)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. THANH ĐIỀU KHIỂN THÁNG BÁO CÁO */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60 flex items-center justify-center shrink-0">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                Chi tiêu {monthLabel}
              </h2>
              {isCurrentMonth && (
                <Badge variant="success" size="sm">
                  Tháng hiện tại
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phân tích cơ cấu và biến động danh mục chi tiêu theo tháng
            </p>
          </div>
        </div>

        {/* Phần chọn tháng căn giữa trên mobile, sang phải trên desktop */}
        <div className="flex items-center justify-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/80">
          <DatePicker
            mode="month"
            variant="stepper"
            month={selectedMonth.month}
            year={selectedMonth.year}
            onMonthChange={handleMonthChange}
            className="border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 shadow-2xs"
          />
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 dark:border-rose-900/60 dark:bg-rose-950/30"
        >
          <div className="flex items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Không tải được báo cáo</h3>
              <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">{error}</p>
              {onRetry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={onRetry}
                  leftIcon={<RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />}
                >
                  Thử lại
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <Card variant="default" className="flex min-h-56 items-center justify-center rounded-2xl p-8">
          <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
            <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
            Đang tải số liệu tháng...
          </div>
        </Card>
      ) : totalExpense === 0 ? (
        <Card variant="default" className="p-8 sm:p-12 text-center rounded-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <Wallet className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Chưa có chi tiêu trong {monthLabel}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Tháng này chưa ghi nhận khoản chi nào.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-slate-200/70 bg-white/55 p-3 dark:border-slate-700/70 dark:bg-slate-800/45">
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Bình quân / ngày</div>
              <CurrencyText amount={0} size="sm" className="mt-1 font-bold text-slate-900 dark:text-slate-100" />
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{daysToCount} ngày được tính</div>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white/55 p-3 dark:border-slate-700/70 dark:bg-slate-800/45">
              <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Ngày chưa chi</div>
              <div className="mt-1 text-base font-bold tabular-nums text-slate-900 dark:text-slate-100">
                {daysToCount} <span className="text-xs font-medium text-slate-500 dark:text-slate-400">/ {daysToCount} ngày</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Không có giao dịch chi tiêu</div>
            </div>
          </div>
        </Card>
      ) : (
        <>
          {/* 2. 4 THẺ CHỈ SỐ KPI TỔNG QUAN (2 CỘT MOBILE, 4 CỘT DESKTOP) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* KPI 1: Tổng chi tiêu */}
            <Card variant="default" className="rounded-2xl p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Tổng chi tiêu</span>
                <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 flex items-center justify-center">
                  <Wallet className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="pt-0.5">
                <CurrencyText
                  amount={totalExpense}
                  size="xl"
                  className="font-bold text-slate-900 dark:text-slate-100 block truncate"
                />
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {activeCount} nhóm phát sinh
              </div>
            </Card>

            {/* KPI 2: Trung bình ngày */}
            <Card variant="default" className="rounded-2xl p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Bình quân / ngày</span>
                <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                  <CalendarClock className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="pt-0.5">
                <CurrencyText
                  amount={Math.round(dailyAverage)}
                  size="xl"
                  className="font-bold text-slate-900 dark:text-slate-100 block truncate"
                />
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                {daysToCount} ngày được tính
              </div>
            </Card>

            {/* KPI 3: Khoản chi lớn nhất */}
            <Card variant="default" className="rounded-2xl p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Chi nhiều nhất</span>
                <span className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="pt-0.5">
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
                  {highestCategory?.name || 'N/A'}
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                {highestCategory && (
                  <>
                    <CurrencyText amount={highestCategory.amount} size="xs" className="font-semibold text-slate-700 dark:text-slate-300" />
                    <span>({((highestCategory.amount / totalExpense) * 100).toFixed(1)}%)</span>
                  </>
                )}
              </div>
            </Card>

            {/* KPI 4: Ngày không phát sinh chi tiêu */}
            <Card variant="default" className="rounded-2xl p-3.5 sm:p-4 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Ngày chưa chi</span>
                <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="pt-0.5">
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {daysWithoutExpense}{' '}
                  <span className="text-xs font-normal text-slate-400">/ {daysToCount} ngày</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">
                Không có giao dịch chi tiêu
              </div>
            </Card>
          </div>

          {/* 3. PHÂN BỔ CHI TIÊU: BIỂU ĐỒ DONUT (TRÁI) VÀ BẢNG XẾP HẠNG TỶ TRỌNG (PHẢI) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* CỘT TRÁI: BIỂU ĐỒ DONUT (5/12 COLS TRÊN DESKTOP) */}
            <Card variant="default" className="lg:col-span-5 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      Cơ cấu chi tiêu
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tỷ lệ phân bổ theo từng nhóm danh mục
                    </p>
                  </div>
                  <Badge variant="neutral" size="sm">
                    {chartData.length} nhóm
                  </Badge>
                </div>

                {/* Donut Chart Container */}
                <div className="relative h-[240px] sm:h-[260px] w-full mt-2 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart
                      style={{ outline: 'none' }}
                      onMouseLeave={() => setActiveCategoryId(null)}
                    >
                      <Pie
                        data={chartData}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={68}
                        outerRadius={98}
                        paddingAngle={2.5}
                        isAnimationActive={false}
                        style={{ outline: 'none' }}
                      >
                        {chartData.map((entry) => {
                          const isSelected = activeCategoryId === entry.id
                          return (
                            <Cell
                              key={`cell-${entry.id}`}
                              fill={entry.color}
                              stroke={isSelected ? '#ffffff' : 'transparent'}
                              strokeWidth={isSelected ? 2 : 0}
                              opacity={activeCategoryId === null || isSelected ? 1 : 0.3}
                              className="transition-all duration-200 cursor-pointer"
                              style={{
                                outline: 'none',
                                filter: isSelected ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.2))' : 'none',
                                transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                                transformOrigin: 'center center',
                              }}
                              onClick={(e) => {
                                e?.stopPropagation?.()
                                setActiveCategoryId((prev) => (prev === entry.id ? null : entry.id))
                              }}
                              onMouseEnter={() => setActiveCategoryId(entry.id)}
                            />
                          )
                        })}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>

                  {/* Center Label inside Donut - Dynamic Display không che lấp chữ */}
                  <div
                    onClick={() => setActiveCategoryId(null)}
                    className="absolute inset-0 m-auto w-[130px] h-[130px] rounded-full flex flex-col items-center justify-center text-center p-2 select-none cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                    title={activeCategory ? 'Bấm để quay về xem Tổng chi' : 'Tổng chi tiêu trong tháng'}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveCategoryId(null)
                      }
                    }}
                  >
                    {activeCategory ? (
                      <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-150 px-1">
                        <div className="flex items-center gap-1.5 max-w-full truncate px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 mb-0.5 shadow-2xs">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: activeCategory.color }}
                          />
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                            {activeCategory.name}
                          </span>
                        </div>
                        <CurrencyText
                          amount={activeCategory.amount}
                          size="sm"
                          className="font-bold text-slate-900 dark:text-slate-100 leading-tight"
                        />
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {activeCategory.percent.toFixed(1)}% <span className="text-[10px] font-normal text-slate-400">tổng chi</span>
                        </span>
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                          (Chạm để hoàn tác)
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 duration-150 px-1">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          Tổng chi
                        </span>
                        <CurrencyText
                          amount={totalExpense}
                          size="md"
                          className="font-bold text-slate-900 dark:text-slate-100 mt-0.5 leading-tight"
                        />
                        <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                          {chartData.length} nhóm phát sinh
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chú thích màu sắc Donut (Tương tác hai chiều: bấm để chọn / bỏ chọn) */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-center gap-1.5 text-xs">
                {chartData.map((item) => {
                  const isSelected = activeCategoryId === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveCategoryId((prev) => (prev === item.id ? null : item.id))}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium transition-all duration-150 cursor-pointer',
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs font-semibold'
                          : 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60'
                      )}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[100px]">{item.name}</span>
                    </button>
                  )
                })}
              </div>
            </Card>

            {/* CỘT PHẢI: XẾP HẠNG CHI TIÊU KÈM THANH TIẾN ĐỘ PROGRESS BAR (7/12 COLS) */}
            <Card variant="default" className="lg:col-span-7 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      Xếp hạng danh mục chi tiêu
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Thứ tự các khoản chi từ lớn đến nhỏ trong {monthLabel}
                    </p>
                  </div>
                </div>

                {/* Ranked Category Rows */}
                <div className="space-y-1.5 mt-2">
                  {sortedCategories.map((item, index) => {
                    const Icon = item.icon
                    const percent = totalExpense > 0 ? (item.amount / totalExpense) * 100 : 0
                    const isSelected = activeCategoryId === item.id

                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveCategoryId((prev) => (prev === item.id ? null : item.id))}
                        className={cn(
                          'p-2.5 sm:p-3 flex flex-col gap-2 rounded-xl border transition-all duration-150 cursor-pointer select-none',
                          isSelected
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-xs'
                            : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200/60 dark:hover:border-slate-800'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Rank Badge */}
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${index === 0
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : index === 1
                                  ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  : index === 2
                                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                              {index + 1}
                            </span>

                            {/* Icon */}
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs"
                              style={{
                                backgroundColor: `${item.color}15`,
                                color: item.color,
                              }}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>

                            <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                              {item.name}
                            </span>
                          </div>

                          {/* Amount & Percentage */}
                          <div className="flex items-center gap-2 text-right shrink-0">
                            <CurrencyText
                              amount={item.amount}
                              size="sm"
                              className="font-bold text-slate-900 dark:text-slate-100"
                            />
                            <span className="text-xs font-semibold text-slate-400 w-12 text-right tabular-nums">
                              {percent.toFixed(1)}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full transition-all duration-300 ease-out',
                              activeCategoryId && !isSelected && 'opacity-40'
                            )}
                            style={{
                              width: `${Math.min(percent, 100)}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Total Row */}
              <div className="pt-3 border-t-2 border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                <span>Tổng cộng</span>
                <CurrencyText amount={totalExpense} size="md" className="font-bold" />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
