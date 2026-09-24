import React from 'react'
import { CalendarRange, Info } from 'lucide-react'
import { Card } from '../ui'
import { type MonthSelection, formatMonthLabel } from './types'

export interface EmptyReportStateProps {
  monthA: MonthSelection
  monthB: MonthSelection
  className?: string
}

export const EmptyReportState: React.FC<EmptyReportStateProps> = ({
  monthA,
  monthB,
  className = '',
}) => {
  const labelA = formatMonthLabel(monthA.month, monthA.year)
  const labelB = formatMonthLabel(monthB.month, monthB.year)

  return (
    <Card
      variant="default"
      className={`rounded-2xl p-8 sm:p-14 text-center flex flex-col items-center justify-center min-h-[420px] shadow-sm ${className}`}
    >
      {/* Icon Lucide đơn giản, không emoji, không artwork quá lớn theo yêu cầu Prompt 25 */}
      <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-center mb-4 shadow-xs">
        <CalendarRange aria-hidden="true" className="w-8 h-8" />
      </div>

      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
        Chưa đủ dữ liệu để so sánh hai tháng
      </h3>

      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg leading-relaxed">
        Hai kỳ <strong className="text-slate-700 dark:text-slate-300">{labelA}</strong> và{' '}
        <strong className="text-slate-700 dark:text-slate-300">{labelB}</strong> chưa có chi tiêu để so sánh.
        Hãy chọn hai tháng có giao dịch để xem biểu đồ và bảng chi tiết.
      </p>

      {/* Hướng dẫn người dùng chọn tháng có dữ liệu */}
      <div className="mt-5 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800 max-w-md text-left flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
        <Info aria-hidden="true" className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Hướng dẫn chọn kỳ so sánh:
          </span>
          <p className="text-[11px] leading-relaxed">
            Hãy dùng bộ chọn Tháng A và Tháng B ở phía trên để thay đổi kỳ báo cáo.
          </p>
        </div>
      </div>
    </Card>
  )
}
