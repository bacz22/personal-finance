import React from 'react'
import { CheckCircle2, EyeOff, Hash } from 'lucide-react'
import { type CategoryItem } from './types'
import { Badge } from '../ui'
import { getCategoryBadgeStyle } from '@/tokens'

export interface CategoryCardProps {
  category: CategoryItem
  onEdit: (category: CategoryItem) => void
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
}) => {
  const Icon = category.icon
  const isExpense = category.type === 'expense'
  const isActive = category.status === 'active'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onEdit(category)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onEdit(category)
        }
      }}
      className={`group relative flex flex-col justify-between bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl border transition-all duration-200 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer active:scale-[0.99] focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 select-none ${
        isActive
          ? 'border-slate-200/80 dark:border-slate-800'
          : 'border-slate-200/60 dark:border-slate-800/80 opacity-75'
      }`}
      aria-label={`Danh mục ${category.name}, bấm để xem và chỉnh sửa`}
    >
      {/* Top row: Icon, Category Name & Color Dot */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Lucide Icon container with design token badge style */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-slate-200/50 dark:border-slate-700/50 shadow-2xs transition-transform group-hover:scale-105"
              style={getCategoryBadgeStyle(category.color)}
              aria-hidden="true"
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {category.name}
                </h3>
                {/* Small color dot indicator */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-900 shadow-2xs"
                  style={{ backgroundColor: category.color }}
                  title={`Mã màu: ${category.color}`}
                  aria-label={`Màu nhận diện ${category.name}`}
                />
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{category.transactionCount || 0} giao dịch liên kết</span>
              </div>
            </div>
          </div>
        </div>

        {/* Description text */}
        {category.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Bottom row: Type badge & Status text */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
        {/* Type Badge using shared Badge component */}
        <Badge
          variant={isExpense ? 'expense' : 'income'}
          size="sm"
        >
          {isExpense ? 'Chi tiêu' : 'Thu nhập'}
        </Badge>

        {/* Trạng thái hoạt động đồng bộ 100% dạng Badge */}
        {isActive ? (
          <Badge
            variant="success"
            size="sm"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Đang sử dụng
          </Badge>
        ) : (
          <Badge
            variant="warning"
            size="sm"
            icon={<EyeOff className="w-3.5 h-3.5" />}
          >
            Ngưng sử dụng
          </Badge>
        )}
      </div>
    </div>
  )
}
