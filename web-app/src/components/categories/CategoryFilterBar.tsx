import React from 'react'
import { Search } from 'lucide-react'
import { Tabs, Input } from '../ui'
import { type CategoryType, type CategoryStatus } from './types'

export interface CategoryFilterBarProps {
  selectedStatus: 'all' | CategoryStatus
  onStatusChange: (status: 'all' | CategoryStatus) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  counts: {
    all: number
    expense?: number
    income?: number
    active: number
    inactive: number
  }
  selectedType?: 'all' | CategoryType
  onTypeChange?: (type: 'all' | CategoryType) => void
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  selectedStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  counts,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
      {/* Ô TÌM KIẾM THEO TÊN HOẶC GHI CHÚ */}
      <div className="flex-1 min-w-0">
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClear={() => onSearchChange('')}
          placeholder="Tìm kiếm danh mục theo tên hoặc ghi chú..."
          leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          fullWidth
          className="text-xs sm:text-sm bg-slate-50/70 dark:bg-slate-800/60"
        />
      </div>

      {/* TABS LỌC THEO TRẠNG THÁI (ĐANG DÙNG / NGƯNG DÙNG) */}
      <div className="overflow-x-auto scrollbar-none -mx-1 px-1 py-0.5 shrink-0 flex justify-center">
        <Tabs<'all' | CategoryStatus>
          value={selectedStatus}
          onChange={onStatusChange}
          size="sm"
          tabs={[
            { id: 'all', label: 'Tất cả' },
            {
              id: 'active',
              label: `Đang dùng (${counts.active})`,
              activeColor: 'emerald',
            },
            {
              id: 'inactive',
              label: `Ngưng dùng (${counts.inactive})`,
              activeColor: 'amber',
            },
          ]}
        />
      </div>
    </div>
  )
}
