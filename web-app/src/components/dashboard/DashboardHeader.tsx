import React from 'react'
import { DatePicker } from '../ui'

export interface DashboardHeaderProps {
  currentMonth?: number // 1 - 12
  currentYear?: number
  onDateChange?: (month: number, year: number) => void
  onAddTransaction?: () => void
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  onDateChange,
}) => {
  const handleMonthYearChange = (m: number, y: number) => {
    onDateChange?.(m, y)
  }

  return (
    <div className="pb-4 md:pb-6 border-b border-slate-200/80 dark:border-slate-800">
      {/* 1. MOBILE COMPACT HEADER (< md): 1 hàng ngang tinh gọn */}
      <div className="flex md:hidden items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight truncate">
            Dashboard
          </h1>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate">
            Tài chính cá nhân
          </span>
        </div>

        <div className="shrink-0">
          {/* Stepper chọn tháng nhỏ gọn */}
          <DatePicker
            mode="month"
            variant="stepper"
            size="sm"
            align="center"
            month={currentMonth}
            year={currentYear}
            onMonthChange={handleMonthYearChange}
          />
        </div>
      </div>

      {/* 2. DESKTOP & TABLET HEADER (>= md): Bố cục tiêu chuẩn */}
      <div className="hidden md:flex flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
            Tổng quan tình hình thu chi, số dư và ngân sách tài chính của bạn.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <DatePicker
            mode="month"
            variant="stepper"
            month={currentMonth}
            year={currentYear}
            onMonthChange={handleMonthYearChange}
          />
        </div>
      </div>
    </div>
  )
}
