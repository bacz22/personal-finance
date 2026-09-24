import React, { useState } from 'react'
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'
import {
  PieChart as PieChartIcon,
  Plus,
} from 'lucide-react'
import { formatVND, formatCompactVND } from '@/utils/formatters'
import { cn } from '@/utils/cn'
import { Button } from '../ui'
import { getCategoryBadgeStyle } from '../../tokens'

export interface ExpenseCategoryItem {
  id: string
  name: string
  amount: number
  color: string
  icon: LucideIcon
}

export interface CategoryExpenseChartProps {
  /** Tháng đang xem (1 - 12) */
  currentMonth?: number
  /** Năm đang xem */
  currentYear?: number
  /** Dữ liệu tùy biến nếu có */
  data?: ExpenseCategoryItem[]
  /** Tổng chi tiêu ghi đè nếu có */
  totalExpense?: number
  /** Callback mở modal thêm giao dịch khi empty */
  onAddTransaction?: () => void
  className?: string
}

export const CategoryExpenseChart: React.FC<CategoryExpenseChartProps> = ({
  currentMonth = new Date().getMonth() + 1,
  currentYear = new Date().getFullYear(),
  data,
  totalExpense: propTotalExpense,
  onAddTransaction,
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  // Ưu tiên hover khi dùng chuột trên desktop, nếu không thì lấy selectedIndex khi click/tap
  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex

  // Dữ liệu danh mục được truyền từ API qua props.
  const categoryList: ExpenseCategoryItem[] = data ?? []

  // Tính tổng chi tiêu
  const computedTotal = categoryList.reduce((sum, item) => sum + item.amount, 0)
  const totalExpense = propTotalExpense !== undefined ? propTotalExpense : computedTotal

  const activeItem = activeIndex !== null ? categoryList[activeIndex] : null
  const activePercent =
    activeItem && totalExpense > 0 ? (activeItem.amount / totalExpense) * 100 : 100

  // Kiểm tra trạng thái rỗng
  const isEmpty = totalExpense === 0 || categoryList.length === 0

  return (
    <div
      className={cn(
        'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between',
        className
      )}
    >
      {/* 1. Header component */}
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Cơ cấu chi tiêu</span>
            <span className="text-xs font-normal text-slate-400">
              (Tháng {String(currentMonth).padStart(2, '0')}/{currentYear})
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tỷ trọng chi tiêu theo từng nhóm danh mục
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Tổng chi
          </span>
          <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatVND(totalExpense, false)}
          </span>
        </div>
      </div>

      {/* 2. Trạng thái rỗng (Empty state theo MASTER.md) */}
      {isEmpty ? (
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 mb-3">
            <PieChartIcon className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có chi tiêu trong tháng này
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] mt-1 mb-4">
            Toàn bộ giao dịch chi tiêu theo danh mục sẽ được phân tích trực quan tại đây.
          </p>
          {onAddTransaction && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddTransaction}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Thêm chi tiêu ngay
            </Button>
          )}
        </div>
      ) : (
        /* 3. Vùng hiển thị Donut Chart & Legend */
        <div className="space-y-4">
          {/* Donut Chart Container - Đặt pointer-events-none để không cho phép bấm trực tiếp vào biểu đồ (tránh viền focus trên mobile) */}
          <div className="relative w-full h-[210px] sm:h-[220px] flex items-center justify-center select-none pointer-events-none">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart style={{ outline: 'none' }}>
                <Pie
                  data={categoryList}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="amount"
                  nameKey="name"
                  stroke="none"
                  isAnimationActive={false}
                  style={{ outline: 'none' }}
                >
                  {categoryList.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                      style={{
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                        outline: 'none',
                      }}
                    />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>

            {/* Thông tin ở tâm Donut Chart (Center Hub) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate max-w-[120px]">
                {activeItem ? activeItem.name.split(' ')[0] : 'Tổng chi'}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-tight">
                {activeItem
                  ? formatCompactVND(activeItem.amount)
                  : formatCompactVND(totalExpense)}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {activePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* 4. Legend danh sách danh mục (Interactive Double Encoding - Chạm để chọn & xem trên biểu đồ) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="grid grid-cols-1 gap-1.5">
              {categoryList.map((cat, idx) => {
                const IconComponent = cat.icon
                const percent = totalExpense > 0 ? (cat.amount / totalExpense) * 100 : 0
                const isActive = activeIndex === idx

                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => {
                      setSelectedIndex((prev) => (prev === idx ? null : idx))
                    }}
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') {
                        setHoveredIndex(idx)
                      }
                    }}
                    onPointerLeave={(e) => {
                      if (e.pointerType === 'mouse') {
                        setHoveredIndex(null)
                      }
                    }}
                    className={cn(
                      'w-full p-2 rounded-xl flex items-center justify-between gap-3 text-xs transition-all duration-150 cursor-pointer select-none text-left border border-transparent',
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 shadow-2xs border-slate-300/80 dark:border-slate-700'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    )}
                  >
                    {/* Bên trái: Icon danh mục & Tên */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-150"
                        style={{
                          ...getCategoryBadgeStyle(cat.color),
                          transform: isActive ? 'scale(1.08)' : 'scale(1)',
                        }}
                      >
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <span
                        className={cn(
                          'truncate transition-colors',
                          isActive
                            ? 'font-bold text-slate-900 dark:text-white'
                            : 'font-medium text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {cat.name}
                      </span>
                    </div>

                    {/* Bên phải: Tỷ trọng % & Số tiền */}
                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <span
                        className="text-[11px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                        style={getCategoryBadgeStyle(cat.color)}
                      >
                        {percent.toFixed(1)}%
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums min-w-[76px]">
                        {formatVND(cat.amount, false)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
