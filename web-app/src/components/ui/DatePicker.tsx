import React, { useState, useRef, useEffect } from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  X,
  Check,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// Helpers
const MONTHS_VN = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

const DAYS_HEADER_VN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function formatDateToVN(isoDateStr?: string): string {
  if (!isoDateStr) return ''
  const parts = isoDateStr.split('-')
  if (parts.length !== 3) return isoDateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function parseISODate(isoStr?: string): Date | null {
  if (!isoStr) return null
  const [y, m, d] = isoStr.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function toISODateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isDateDisabled(d: Date, min?: string, max?: string): boolean {
  const iso = toISODateString(d)
  if (min && iso < min) return true
  if (max && iso > max) return true
  return false
}

// ----------------------------------------------------
// 1. UNIFIED DATEPICKER COMPONENT (Date, Month/Year Selection)
// ----------------------------------------------------
export interface DatePickerProps {
  /** Kiểu chọn: 'date' (chọn ngày cụ thể) hoặc 'month' (chọn kỳ tháng/năm) */
  mode?: 'date' | 'month'
  /** Kiểu hiển thị trigger: 'input' (ô nhập chuẩn) hoặc 'stepper' ([<] [Tiêu đề] [>]) */
  variant?: 'input' | 'stepper'
  /** Giá trị ngày (YYYY-MM-DD với date, YYYY-MM với month) */
  value?: string
  defaultValue?: string
  onChange?: (val: string) => void

  /** Thuộc tính chuyên dụng cho mode month */
  month?: number // 1 - 12
  year?: number
  onMonthChange?: (month: number, year: number) => void

  placeholder?: string
  minDate?: string
  maxDate?: string
  disabled?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  /** Vị trí căn chỉnh popover so với trigger ('start' | 'center' | 'end'), mặc định 'center' cho stepper và 'start' cho input */
  align?: 'start' | 'center' | 'end'
  className?: string
}

export const DatePicker: React.FC<DatePickerProps> = ({
  mode = 'date',
  variant,
  value,
  defaultValue,
  onChange,
  month,
  year,
  onMonthChange,
  placeholder,
  minDate,
  maxDate,
  disabled = false,
  hasError = false,
  hasSuccess = false,
  size = 'md',
  align,
  className,
}) => {
  const isMonthMode = mode === 'month'
  const effectiveVariant = variant || (isMonthMode ? 'stepper' : 'input')
  const effectiveAlign = align || (effectiveVariant === 'stepper' ? 'center' : 'start')
  const effectivePlaceholder = placeholder || (isMonthMode ? 'Chọn tháng...' : 'Chọn ngày...')

  // Trạng thái ngày hôm nay
  const now = new Date()
  const todayMonth = now.getMonth() + 1 // 1 - 12
  const todayYear = now.getFullYear()
  const todayDateStr = toISODateString(now)

  // Quản lý internal value cho mode date
  const [internalDateVal, setInternalDateVal] = useState(defaultValue || '')
  const selectedDateStr = value !== undefined ? value : internalDateVal
  const selectedDateObj = parseISODate(selectedDateStr)

  // Quản lý month/year khi ở mode month
  const [internalMonth, setInternalMonth] = useState<number>(
    month !== undefined
      ? month
      : defaultValue && defaultValue.includes('-')
      ? Number(defaultValue.split('-')[1])
      : todayMonth
  )
  const [internalYear, setInternalYear] = useState<number>(
    year !== undefined
      ? year
      : defaultValue && defaultValue.includes('-')
      ? Number(defaultValue.split('-')[0])
      : todayYear
  )

  const activeMonth = month !== undefined ? month : internalMonth
  const activeYear = year !== undefined ? year : internalYear

  // View state cho popup lịch
  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'days' | 'months' | 'years'>(isMonthMode ? 'months' : 'days')

  const initialViewYear = isMonthMode
    ? activeYear
    : selectedDateObj
    ? selectedDateObj.getFullYear()
    : todayYear
  const initialViewMonth = isMonthMode
    ? activeMonth - 1
    : selectedDateObj
    ? selectedDateObj.getMonth()
    : now.getMonth()

  const [viewYear, setViewYear] = useState(initialViewYear)
  const [viewMonth, setViewMonth] = useState(initialViewMonth)

  // Đồng bộ view khi mở popover thông qua handleOpenChange
  const handleOpenChange = (open: boolean) => {
    if (disabled) {
      setIsOpen(false)
      return
    }
    setIsOpen(open)
    if (open) {
      if (isMonthMode) {
        setViewYear(activeYear)
        setViewMode('months')
      } else {
        const y = selectedDateObj ? selectedDateObj.getFullYear() : new Date().getFullYear()
        const m = selectedDateObj ? selectedDateObj.getMonth() : new Date().getMonth()
        setViewYear(y)
        setViewMonth(m)
        setViewMode('days')
      }
    }
  }

  // --- Handlers cho Date mode ---
  const handleSelectDate = (d: Date) => {
    if (disabled) return
    const iso = toISODateString(d)
    setInternalDateVal(iso)
    onChange?.(iso)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    setInternalDateVal('')
    onChange?.('')
  }

  const handleSetTodayDate = () => {
    const d = new Date()
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
    handleSelectDate(d)
  }

  // --- Handlers cho Month mode ---
  const handleSelectMonth = (mNum: number) => {
    if (isMonthMode) {
      setInternalMonth(mNum)
      setInternalYear(viewYear)
      onMonthChange?.(mNum, viewYear)
      const isoMonth = `${viewYear}-${String(mNum).padStart(2, '0')}`
      onChange?.(isoMonth)
      setIsOpen(false)
    } else {
      // Trong date mode, chọn tháng thì chuyển về xem ngày của tháng đó
      setViewMonth(mNum - 1)
      setViewMode('days')
    }
  }

  const handleSelectYear = (y: number) => {
    setViewYear(y)
    setViewMode('months')
  }

  const handleResetCurrentMonth = () => {
    setInternalMonth(todayMonth)
    setInternalYear(todayYear)
    setViewYear(todayYear)
    onMonthChange?.(todayMonth, todayYear)
    const isoMonth = `${todayYear}-${String(todayMonth).padStart(2, '0')}`
    onChange?.(isoMonth)
    setIsOpen(false)
  }

  // --- Stepper Navigation Buttons ([<] [Title] [>]) ---
  const handlePrevStepper = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMonthMode) {
      let newM = activeMonth - 1
      let newY = activeYear
      if (newM < 1) {
        newM = 12
        newY -= 1
      }
      setInternalMonth(newM)
      setInternalYear(newY)
      onMonthChange?.(newM, newY)
      onChange?.(`${newY}-${String(newM).padStart(2, '0')}`)
    } else {
      const cur = selectedDateObj || new Date()
      const prevD = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - 1)
      handleSelectDate(prevD)
    }
  }

  const handleNextStepper = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isMonthMode) {
      let newM = activeMonth + 1
      let newY = activeYear
      if (newM > 12) {
        newM = 1
        newY += 1
      }
      setInternalMonth(newM)
      setInternalYear(newY)
      onMonthChange?.(newM, newY)
      onChange?.(`${newY}-${String(newM).padStart(2, '0')}`)
    } else {
      const cur = selectedDateObj || new Date()
      const nextD = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 1)
      handleSelectDate(nextD)
    }
  }

  // --- Calendar Day Cells Generation ---
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6

  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  const calendarDays: {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    isSelected: boolean
    isDisabled: boolean
  }[] = []

  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = new Date(viewYear, viewMonth - 1, daysInPrevMonth - i)
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDateObj ? toISODateString(d) === selectedDateStr : false,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(viewYear, viewMonth, day)
    const iso = toISODateString(d)
    calendarDays.push({
      date: d,
      isCurrentMonth: true,
      isToday: iso === todayDateStr,
      isSelected: iso === selectedDateStr,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  const remainingCells = (7 - (calendarDays.length % 7)) % 7
  for (let day = 1; day <= remainingCells; day++) {
    const d = new Date(viewYear, viewMonth + 1, day)
    calendarDays.push({
      date: d,
      isCurrentMonth: false,
      isToday: false,
      isSelected: selectedDateObj ? toISODateString(d) === selectedDateStr : false,
      isDisabled: isDateDisabled(d, minDate, maxDate),
    })
  }

  // Decade calculation for year selector (12 years grid)
  const decadeStart = Math.floor(viewYear / 12) * 12
  const yearsList = Array.from({ length: 12 }, (_, i) => decadeStart + i)

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-xl',
    md: 'h-10 px-3.5 text-sm rounded-2xl',
    lg: 'h-11 px-4 text-base rounded-2xl',
  }[size]

  // Render Label text
  const displayLabel = isMonthMode
    ? `Tháng ${String(activeMonth).padStart(2, '0')}, ${activeYear}`
    : selectedDateStr
    ? formatDateToVN(selectedDateStr)
    : effectivePlaceholder

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      {/* 1. TRIGGER RENDER */}
      {effectiveVariant === 'stepper' ? (
        <div
          className={cn(
            'inline-flex items-center rounded-2xl p-1 select-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)]',
            disabled
              ? 'bg-slate-100 text-slate-500 border border-slate-200 pointer-events-none'
              : 'bg-[var(--glass-surface,rgba(255,255,255,0.85))] backdrop-blur-[var(--glass-blur,16px)] border border-white/80 dark:border-slate-700/60 hover:border-white',
            className
          )}
        >
          <button
            type="button"
            disabled={disabled}
            onClick={handlePrevStepper}
            className={cn(
              'inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer',
              size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
            )}
            title={isMonthMode ? 'Tháng trước' : 'Ngày trước'}
            aria-label={isMonthMode ? 'Tháng trước' : 'Ngày trước'}
          >
            <ChevronLeft className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>

          <PopoverPrimitive.Trigger asChild disabled={disabled}>
            <button
              type="button"
              className={cn(
                'font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white/70 dark:hover:bg-slate-800/70 rounded-xl transition-all flex items-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20',
                size === 'sm' ? 'px-2 py-1 text-xs gap-1.5' : 'px-3 py-1.5 text-xs sm:text-sm gap-2'
              )}
              title="Bấm để chọn tháng và năm"
              aria-label="Chọn tháng và năm"
            >
              <CalendarIcon className={cn('text-emerald-600 dark:text-emerald-400 shrink-0', size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
              <span>{displayLabel}</span>
            </button>
          </PopoverPrimitive.Trigger>

          <button
            type="button"
            disabled={disabled}
            onClick={handleNextStepper}
            className={cn(
              'inline-flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-800/70 rounded-xl transition-all cursor-pointer',
              size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
            )}
            title={isMonthMode ? 'Tháng sau' : 'Ngày sau'}
            aria-label={isMonthMode ? 'Tháng sau' : 'Ngày sau'}
          >
            <ChevronRight className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </button>
        </div>
      ) : (
        <PopoverPrimitive.Trigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'input-control w-full flex items-center justify-between gap-2 border rounded-2xl select-none transition-all duration-200 text-left',
              disabled
                ? 'bg-slate-100/60 text-slate-400 border-slate-200 cursor-not-allowed pointer-events-none select-none'
                : hasError
                ? 'border-rose-400 bg-rose-50/50 text-rose-900 has-error cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.9)]'
                : hasSuccess
                ? 'border-emerald-500 has-success bg-white text-slate-900 cursor-pointer'
                : 'border-slate-300 dark:border-white/20 bg-white/85 dark:bg-slate-900/80 backdrop-blur-[var(--glass-blur,16px)] text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-white/30 hover:bg-white dark:hover:bg-slate-900/95 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] cursor-pointer',
              sizeClasses,
              className
            )}
          >
            <span
              className={cn(
                'truncate font-medium',
                disabled
                  ? 'text-slate-500'
                  : !selectedDateStr && !isMonthMode
                  ? 'text-slate-400 font-normal'
                  : ''
              )}
            >
              {displayLabel}
            </span>

            <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
              {selectedDateStr && !disabled && !isMonthMode && (
                <span
                  role="button"
                  onClick={handleClear}
                  className="p-0.5 hover:text-slate-700 rounded cursor-pointer transition-colors"
                  title="Xóa đã chọn"
                >
                  <X className="w-3.5 h-3.5" />
                </span>
              )}
              <CalendarIcon className="w-4 h-4 text-slate-500" />
            </div>
          </button>
        </PopoverPrimitive.Trigger>
      )}

      {/* 2. POPOVER CONTENT */}
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={effectiveAlign}
          sideOffset={6}
          collisionPadding={12}
          className="z-50 w-72 sm:w-84 p-4 rounded-3xl border border-white/90 dark:border-slate-700/60 bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-[var(--glass-blur,24px)] shadow-[0_20px_60px_rgba(15,23,42,0.14),0_4px_20px_rgba(0,0,0,0.04)] animate-in fade-in-0 zoom-in-95 duration-150 text-slate-900 dark:text-white"
        >
          {/* POPUP HEADER - TÍCH HỢP CHỌN THÁNG VÀ NĂM */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/60 dark:border-slate-800/60">
            {viewMode === 'days' && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (viewMonth === 0) {
                      setViewMonth(11)
                      setViewYear(viewYear - 1)
                    } else {
                      setViewMonth(viewMonth - 1)
                    }
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-white/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="Tháng trước"
                  aria-label="Tháng trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('months')}
                  className="px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/85 dark:hover:bg-slate-800/85 border border-white/70 dark:border-slate-700/60 font-bold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-slate-100 shadow-2xs backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Bấm để chọn tháng nhanh"
                >
                  <span>{MONTHS_VN[viewMonth]} {viewYear}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (viewMonth === 11) {
                      setViewMonth(0)
                      setViewYear(viewYear + 1)
                    } else {
                      setViewMonth(viewMonth + 1)
                    }
                  }}
                  className="p-1.5 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-white/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="Tháng sau"
                  aria-label="Tháng sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {viewMode === 'months' && (
              <>
                <button
                  type="button"
                  onClick={() => setViewYear(viewYear - 1)}
                  className="p-1.5 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-white/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="Năm trước"
                  aria-label="Năm trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewMode('years')}
                  className="px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white/85 dark:hover:bg-slate-800/85 border border-white/70 dark:border-slate-700/60 font-bold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-slate-100 shadow-2xs backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Bấm để chọn năm nhanh"
                >
                  <span>Năm {viewYear}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => setViewYear(viewYear + 1)}
                  className="p-1.5 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-white/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="Năm sau"
                  aria-label="Năm sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {viewMode === 'years' && (
              <>
                <button
                  type="button"
                  onClick={() => setViewYear(viewYear - 12)}
                  className="p-1.5 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-white/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="12 năm trước"
                  aria-label="12 năm trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="font-bold text-xs sm:text-sm tracking-tight text-slate-800 dark:text-slate-100 px-3 py-1.5 rounded-xl bg-white/50 dark:bg-slate-800/50 border border-white/70 dark:border-slate-700/60 shadow-2xs backdrop-blur-xs">
                  {decadeStart} – {decadeStart + 11}
                </div>

                <button
                  type="button"
                  onClick={() => setViewYear(viewYear + 12)}
                  className="p-1.5 rounded-xl hover:bg-white/70 dark:hover:bg-slate-800/70 border border-transparent hover:border-white/80 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
                  title="12 năm sau"
                  aria-label="12 năm sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* VIEW 1: LƯỚI NGÀY (DAYS VIEW) */}
          {viewMode === 'days' && (
            <>
              {/* Tiêu đề thứ trong tuần */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {DAYS_HEADER_VN.map((dayName, idx) => (
                  <div
                    key={dayName}
                    className={cn(
                      'text-[11px] font-semibold py-1 select-none',
                      idx >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'
                    )}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              {/* Lưới 35 hoặc 42 ô ngày */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {calendarDays.map((item, idx) => {
                  const dayNum = item.date.getDate()
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={item.isDisabled}
                      onClick={() => !item.isDisabled && handleSelectDate(item.date)}
                      className={cn(
                        'h-8 w-8 mx-auto flex items-center justify-center text-xs rounded-xl transition-all relative select-none font-medium cursor-pointer',
                        item.isSelected
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/25 scale-105 z-10 border border-emerald-400/50'
                          : item.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:border-white/80 border border-transparent hover:text-emerald-700 dark:hover:text-emerald-400'
                          : 'text-slate-300 dark:text-slate-600 hover:bg-white/40 dark:hover:bg-slate-800/40 border border-transparent',
                        item.isDisabled && 'opacity-30 cursor-not-allowed hover:bg-transparent text-slate-300',
                        item.isToday && !item.isSelected && 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-500/30'
                      )}
                    >
                      <span>{dayNum}</span>
                      {item.isToday && !item.isSelected && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Footer thao tác nhanh */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/60 dark:border-slate-800/60 text-xs">
                <button
                  type="button"
                  onClick={handleSetTodayDate}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white border border-white/70 dark:border-slate-700/60 text-emerald-600 dark:text-emerald-400 font-semibold shadow-2xs backdrop-blur-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  Hôm nay
                </button>
                {selectedDateStr && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="px-2 py-1 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-white/50 font-medium transition-colors cursor-pointer"
                  >
                    Xóa chọn
                  </button>
                )}
              </div>
            </>
          )}

          {/* VIEW 2: LƯỚI 12 THÁNG (MONTHS VIEW) */}
          {viewMode === 'months' && (
            <>
              <div className="grid grid-cols-3 gap-2 py-1">
                {MONTHS_VN.map((mName, idx) => {
                  const mNum = idx + 1
                  const isSelected = isMonthMode
                    ? mNum === activeMonth && viewYear === activeYear
                    : mNum === viewMonth + 1

                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => handleSelectMonth(mNum)}
                      className={cn(
                        'py-2.5 px-2 text-xs rounded-2xl font-medium transition-all text-center flex items-center justify-center cursor-pointer select-none',
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/30 border border-emerald-400/40 scale-[1.02]'
                          : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-white/60 dark:border-slate-700/60 hover:border-white text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 shadow-2xs backdrop-blur-xs hover:scale-[1.02]'
                      )}
                    >
                      <span>{mName}</span>
                    </button>
                  )
                })}
              </div>

              {/* Footer cho Month Picker */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/60 dark:border-slate-800/60 text-xs">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  {isMonthMode ? 'Dữ liệu lọc theo kỳ' : 'Bấm chọn tháng để xem ngày'}
                </span>
                {isMonthMode ? (
                  <button
                    type="button"
                    onClick={handleResetCurrentMonth}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white border border-white/80 dark:border-slate-700/60 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-semibold shadow-2xs backdrop-blur-xs transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tháng này</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setViewMode('days')}
                    className="px-2.5 py-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 font-medium transition-colors cursor-pointer"
                  >
                    Quay lại ngày
                  </button>
                )}
              </div>
            </>
          )}

          {/* VIEW 3: LƯỚI 12 NĂM (YEARS VIEW) */}
          {viewMode === 'years' && (
            <>
              <div className="grid grid-cols-3 gap-2 py-1">
                {yearsList.map((y) => {
                  const isSelected = y === viewYear
                  const isCurrentYear = y === todayYear

                  return (
                    <button
                      key={y}
                      type="button"
                      onClick={() => handleSelectYear(y)}
                      className={cn(
                        'py-2.5 px-2 text-xs rounded-2xl font-medium transition-all text-center flex items-center justify-center cursor-pointer select-none',
                        isSelected
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/30 border border-emerald-400/40 scale-[1.02]'
                          : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/90 dark:hover:bg-slate-800/90 border border-white/60 dark:border-slate-700/60 hover:border-white text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 shadow-2xs backdrop-blur-xs hover:scale-[1.02]',
                        isCurrentYear && !isSelected && 'border-emerald-500/50 text-emerald-700 font-bold bg-emerald-50/50'
                      )}
                    >
                      <span>{y}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/60 dark:border-slate-800/60 text-xs">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Chọn năm để duyệt 12 tháng</span>
                <button
                  type="button"
                  onClick={() => setViewMode('months')}
                  className="px-2.5 py-1 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 font-medium transition-colors cursor-pointer"
                >
                  Quay lại tháng
                </button>
              </div>
            </>
          )}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

// ----------------------------------------------------
// 2. MONTHPICKER WRAPPER COMPONENT (Dùng chung qua DatePicker)
// ----------------------------------------------------
export interface MonthPickerProps {
  month?: number // 1 - 12
  year?: number
  onChange?: (month: number, year: number) => void
  disabled?: boolean
  className?: string
  variant?: 'stepper' | 'input'
  size?: 'sm' | 'md' | 'lg'
  align?: 'start' | 'center' | 'end'
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  month,
  year,
  onChange,
  disabled,
  className,
  variant = 'stepper',
  size = 'md',
  align = 'center',
}) => {
  return (
    <DatePicker
      mode="month"
      variant={variant}
      size={size}
      align={align}
      month={month}
      year={year}
      onMonthChange={onChange}
      disabled={disabled}
      className={className}
    />
  )
}

// ----------------------------------------------------
// 3. CUSTOM TIMEPICKER COMPONENT (00-23h & 00-59m with auto-scroll)
// ----------------------------------------------------
export interface TimePickerProps {
  value?: string // HH:mm (24h)
  defaultValue?: string
  onChange?: (time: string) => void
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const HOURS_LIST = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES_LIST = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

const QUICK_TIME_PRESETS = [
  { label: '08:00 (Sáng sớm)', time: '08:00' },
  { label: '09:30 (Khung giờ vàng)', time: '09:30' },
  { label: '14:00 (Đầu giờ chiều)', time: '14:00' },
  { label: '18:00 (Tan sở)', time: '18:00' },
  { label: '20:30 (Buổi tối)', time: '20:30' },
]

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  defaultValue,
  onChange,
  placeholder = 'Chọn giờ...',
  disabled = false,
  hasError = false,
  hasSuccess = false,
  size = 'md',
  className,
}) => {
  const [internalVal, setInternalVal] = useState(defaultValue || '')
  const [isOpen, setIsOpen] = useState(false)

  const hoursContainerRef = useRef<HTMLDivElement>(null)
  const minutesContainerRef = useRef<HTMLDivElement>(null)

  const selectedTime = value !== undefined ? value : internalVal
  const [selectedHour, selectedMinute] = selectedTime.includes(':')
    ? selectedTime.split(':')
    : ['09', '30']

  // Auto scroll to active hour & minute when opening popover
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const selHourEl = hoursContainerRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
        if (selHourEl && hoursContainerRef.current) {
          hoursContainerRef.current.scrollTop = selHourEl.offsetTop - hoursContainerRef.current.offsetTop - 40
        }

        const selMinEl = minutesContainerRef.current?.querySelector('[data-selected="true"]') as HTMLElement | null
        if (selMinEl && minutesContainerRef.current) {
          minutesContainerRef.current.scrollTop = selMinEl.offsetTop - minutesContainerRef.current.offsetTop - 40
        }
      }, 30)
      return () => clearTimeout(timer)
    }
  }, [isOpen, selectedHour, selectedMinute])

  const handleSelectTime = (h: string, m: string) => {
    const t = `${h}:${m}`
    setInternalVal(t)
    onChange?.(t)
  }

  const handleSelectPreset = (t: string) => {
    setInternalVal(t)
    onChange?.(t)
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInternalVal('')
    onChange?.('')
  }

  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-xl',
    md: 'h-10 px-3.5 text-sm rounded-2xl',
    lg: 'h-11 px-4 text-base rounded-2xl',
  }[size]

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <PopoverPrimitive.Trigger asChild disabled={disabled}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          className={cn(
            'input-control w-full flex items-center justify-between gap-2 border rounded-2xl select-none transition-all duration-200 shadow-2xs',
            disabled
              ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed select-none pointer-events-none'
              : hasError
              ? 'border-rose-400 bg-rose-50/40 text-rose-900 has-error cursor-pointer'
              : hasSuccess
              ? 'border-emerald-500 has-success bg-white/90 text-slate-900 cursor-pointer'
              : 'border-white/80 dark:border-slate-700/60 bg-[var(--glass-surface,rgba(255,255,255,0.72))] dark:bg-slate-900/75 backdrop-blur-[var(--glass-blur,16px)] text-slate-900 dark:text-white hover:border-white dark:hover:border-slate-500 hover:bg-[var(--glass-surface,rgba(255,255,255,0.85))] dark:hover:bg-slate-900/85 focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer',
            sizeClasses,
            className
          )}
        >
          <span
            className={cn(
              'truncate font-medium font-mono',
              disabled
                ? 'text-slate-500 font-sans'
                : !selectedTime && 'text-slate-400 font-sans font-normal'
            )}
          >
            {selectedTime ? selectedTime : placeholder}
          </span>

          <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
            {selectedTime && !disabled && (
              <span
                role="button"
                onClick={handleClear}
                className="p-0.5 hover:text-slate-700 rounded cursor-pointer transition-colors"
                title="Xóa giờ đã chọn"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </PopoverPrimitive.Trigger>

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-50 w-72 p-4 rounded-3xl border border-white/90 dark:border-slate-700/60 bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-[var(--glass-blur,24px)] shadow-[0_20px_60px_rgba(15,23,42,0.14),0_4px_20px_rgba(0,0,0,0.04)] animate-in fade-in-0 zoom-in-95 duration-150 text-slate-900 dark:text-white"
        >
          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/60 dark:border-slate-800/60">
            <div className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Chọn Thời Gian (24H)
            </div>
            <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-white/60 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-lg border border-white/80 dark:border-emerald-800 shadow-2xs backdrop-blur-xs">
              {selectedHour}:{selectedMinute}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border border-white/60 dark:border-slate-800 rounded-2xl p-2 bg-white/40 dark:bg-slate-950/40 backdrop-blur-md">
            {/* Hours Column (00 - 23) */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center pb-1.5 mb-1 border-b border-white/60 dark:border-slate-800">
                Giờ (00 - 23)
              </div>
              <div
                ref={hoursContainerRef}
                className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
              >
                {HOURS_LIST.map((h) => {
                  const isSel = h === selectedHour
                  return (
                    <button
                      key={h}
                      type="button"
                      data-selected={isSel ? 'true' : undefined}
                      onClick={() => handleSelectTime(h, selectedMinute)}
                      className={cn(
                        'w-full py-1.5 text-center rounded-xl text-xs font-mono transition-all select-none cursor-pointer',
                        isSel
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/25 scale-[1.02]'
                          : 'hover:bg-white/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                      )}
                    >
                      {h}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Minutes Column (00 - 59 Full List) */}
            <div>
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 text-center pb-1.5 mb-1 border-b border-white/60 dark:border-slate-800">
                Phút (00 - 59)
              </div>
              <div
                ref={minutesContainerRef}
                className="max-h-48 overflow-y-auto pr-1 space-y-1 scrollbar-thin"
              >
                {MINUTES_LIST.map((m) => {
                  const isSel = m === selectedMinute
                  return (
                    <button
                      key={m}
                      type="button"
                      data-selected={isSel ? 'true' : undefined}
                      onClick={() => handleSelectTime(selectedHour, m)}
                      className={cn(
                        'w-full py-1.5 text-center rounded-xl text-xs font-mono transition-all select-none cursor-pointer',
                        isSel
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/25 scale-[1.02]'
                          : 'hover:bg-white/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                      )}
                    >
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="mt-3 pt-2.5 border-t border-white/60 dark:border-slate-800 space-y-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Gợi Ý Nhanh
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_TIME_PRESETS.map((preset) => (
                <button
                  key={preset.time}
                  type="button"
                  onClick={() => handleSelectPreset(preset.time)}
                  className={cn(
                    'text-left px-2.5 py-1.5 rounded-xl text-[11px] flex items-center justify-between transition-all cursor-pointer border',
                    selectedTime === preset.time
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-white/40 dark:bg-slate-800/40 hover:bg-white/80 dark:hover:bg-slate-800 border-white/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300'
                  )}
                >
                  <span className="truncate">{preset.label.split(' ')[0]}</span>
                  {selectedTime === preset.time && <Check className="w-3 h-3 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

// ----------------------------------------------------
// 4. COMBINED DATETIMEPICKER COMPONENT
// ----------------------------------------------------
export interface DateTimePickerProps {
  dateValue?: string
  timeValue?: string
  onDateChange?: (date: string) => void
  onTimeChange?: (time: string) => void
  disabled?: boolean
  hasError?: boolean
  hasSuccess?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled,
  hasError,
  hasSuccess,
  size = 'md',
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2 w-full', className)}>
      <div className="flex-1">
        <DatePicker
          mode="date"
          value={dateValue}
          onChange={onDateChange}
          disabled={disabled}
          hasError={hasError}
          hasSuccess={hasSuccess}
          size={size}
        />
      </div>
      <div className="w-32 sm:w-40">
        <TimePicker
          value={timeValue}
          onChange={onTimeChange}
          disabled={disabled}
          hasError={hasError}
          hasSuccess={hasSuccess}
          size={size}
        />
      </div>
    </div>
  )
}