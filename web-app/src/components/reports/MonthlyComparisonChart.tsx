import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react'
import { formatVND, formatCompactVND } from '@/utils/formatters'
import { ReportsChartSkeleton } from '../ui/Skeleton'
import {
  type CalculatedComparisonRow,
  type MonthSelection,
  formatMonthLabel,
  MONTH_A_COLOR,
  MONTH_B_COLOR,
} from './types'
import { CHART_TOKENS } from '../../tokens'

export interface MonthlyComparisonChartProps {
  /** Trạng thái loading skeleton */
  isLoading?: boolean
  monthA: MonthSelection
  monthB: MonthSelection
  data: CalculatedComparisonRow[]
}

// Custom Tooltip tối ưu kích thước gọn gàng, tinh tế
interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    value?: number
    payload: CalculatedComparisonRow
  }>
  label?: string
  monthALabel: string
  monthBLabel: string
}

const CustomChartTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  monthALabel,
  monthBLabel,
}) => {
  if (!active || !payload || payload.length === 0) return null

  // Tìm row tương ứng để lấy thông tin chênh lệch chính xác
  const rowData = payload[0]?.payload
  const valA = payload.find((p) => p.dataKey === 'monthAAmount')?.value || 0
  const valB = payload.find((p) => p.dataKey === 'monthBAmount')?.value || 0

  const diff = valB - valA
  const isNew = valA === 0 && valB > 0
  const percent =
    valA > 0 ? Math.round(((valB - valA) / valA) * 1000) / 10 : null

  return (
    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg shadow-lg border border-slate-200 dark:border-slate-800 text-[11px] sm:text-xs min-w-[175px] sm:min-w-[190px] z-50 animate-in fade-in zoom-in-95 duration-150">
      {/* Category Header */}
      <div className="flex items-center gap-1.5 pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-800">
        {rowData?.categoryColor && (
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: rowData.categoryColor }}
          />
        )}
        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
          {label || rowData?.categoryName}
        </span>
      </div>

      {/* Tháng A */}
      <div className="flex items-center justify-between gap-3 py-0.5">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: MONTH_A_COLOR }}
          />
          <span>{monthALabel}:</span>
        </div>
        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          {formatVND(valA)}
        </span>
      </div>

      {/* Tháng B */}
      <div className="flex items-center justify-between gap-3 py-0.5">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: MONTH_B_COLOR }}
          />
          <span>{monthBLabel}:</span>
        </div>
        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
          {formatVND(valB)}
        </span>
      </div>

      {/* Biến động & Chênh lệch */}
      <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <span className="text-slate-500 font-medium">Chênh lệch:</span>
        <div className="flex items-center gap-1 font-bold tabular-nums">
          <span
            className={
              diff > 0
                ? 'text-rose-600 dark:text-rose-400'
                : diff < 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-600'
            }
          >
            {formatVND(diff, true)}
          </span>

          {isNew ? (
            <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Mới
            </span>
          ) : percent !== null ? (
            <span
              className={`inline-flex items-center text-[10px] sm:text-[11px] ${
                diff > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : diff < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              {diff > 0 ? (
                <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
              ) : diff < 0 ? (
                <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
              ) : (
                <Minus className="w-2.5 h-2.5 mr-0.5" />
              )}
              {percent > 0 ? `+${percent}%` : `${percent}%`}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  isLoading = false,
  monthA,
  monthB,
  data,
}) => {
  const monthALabel = formatMonthLabel(monthA.month, monthA.year)
  const monthBLabel = formatMonthLabel(monthB.month, monthB.year)

  if (isLoading) {
    return <ReportsChartSkeleton />
  }

  // Chiều cao tự động thích ứng với số lượng danh mục để khoảng cách giữa các thanh luôn thoáng đẹp
  const chartHeight = Math.max(360, data.length * 48)

  return (
    <div className="rounded-3xl p-4 sm:p-6 bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl border border-white/85 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset]">
      {/* Chart Header */}
      <div className="pb-4 sm:pb-5 border-b border-white/60 dark:border-white/10">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
          Biểu đồ đối sánh chi tiêu theo danh mục
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          So sánh trực quan hai thanh chi tiêu song song cho từng nhóm chi tiêu
        </p>
      </div>

      {/* RÕ RÀNG VỀ Ý NGHĨA MÀU SẮC (LEGEND ĐỒNG NHẤT, KHÔNG DÙNG ĐỂ THỂ HIỆN TĂNG GIẢM) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2 text-xs">
        <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
          {/* Chú thích Tháng A */}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm shrink-0 shadow-2xs"
              style={{ backgroundColor: MONTH_A_COLOR }}
              aria-hidden="true"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {monthALabel}{' '}
            </span>
          </div>

          {/* Chú thích Tháng B */}
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm shrink-0 shadow-2xs"
              style={{ backgroundColor: MONTH_B_COLOR }}
              aria-hidden="true"
            />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {monthBLabel}{' '}
            </span>
          </div>
        </div>

        {/* Tip giải thích theo prompt: Màu sắc đại diện cho 2 tháng, không phụ thuộc màu để thể hiện tăng giảm */}
        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Màu cột đại diện cho mốc thời gian hai tháng</span>
        </div>
      </div>

      {/* BIỂU ĐỒ THANH NGANG (HORIZONTAL BAR CHART) - DỄ QUAN SÁT VÀ ĐỌC TÊN DANH MỤC TRÊN MỌI THIẾT BỊ */}
      <div className="w-full mt-3" style={{ height: `${chartHeight}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 12, right: 20, left: 8, bottom: 12 }}
            barGap={3}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="currentColor"
              className="text-slate-200/80 dark:text-slate-800"
            />
            <XAxis
              type="number"
              tickFormatter={(val: number) => formatCompactVND(val)}
              tickLine={false}
              axisLine={{ stroke: CHART_TOKENS.axis, strokeWidth: 1 }}
              tick={{
                fill: CHART_TOKENS.text,
                fontSize: 12,
              }}
            />
            <YAxis
              type="category"
              dataKey="categoryName"
              tickLine={false}
              axisLine={false}
              tick={{
                fill: 'currentColor',
                fontSize: 12,
                fontWeight: 600,
              }}
              className="text-slate-700 dark:text-slate-200"
              width={85}
            />
            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={
                <CustomChartTooltip
                  monthALabel={monthALabel}
                  monthBLabel={monthBLabel}
                />
              }
            />
            <Bar
              dataKey="monthAAmount"
              name={monthALabel}
              fill={MONTH_A_COLOR}
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
            />
            <Bar
              dataKey="monthBAmount"
              name={monthBLabel}
              fill={MONTH_B_COLOR}
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ghi chú chân biểu đồ */}
      <div className="mt-2 pt-3 border-t border-white/60 dark:border-white/10 flex items-center justify-center text-xs text-slate-500">
        <span className="text-[11px] text-slate-400 text-center">
          Đơn vị: Đồng (VND)
        </span>
      </div>
    </div>
  )
}
