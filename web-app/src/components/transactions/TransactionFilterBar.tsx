import React, { useState } from 'react'
import {
  Search,
  RotateCcw,
  SlidersHorizontal,
  Calendar,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { DatePicker, Select, Input, Button, Badge, Tabs } from '../ui'
import {
  type TransactionFilters,
  type TransactionTypeFilter,
  type CategoryOption,
  DEFAULT_FILTERS,
  DATE_PRESET_OPTIONS,
  countActiveFilters,
  getDatePresetRange,
} from './types'
import { CATEGORY_COLORS, getCategoryBadgeStyle } from '../../tokens'
import { Layers } from 'lucide-react'

function formatDateDisplay(isoStr?: string): string {
  if (!isoStr) return ''
  const parts = isoStr.split('-')
  if (parts.length !== 3) return isoStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

// =========================================================================
// TRANSACTION FILTER BAR PROPS
// =========================================================================
export interface TransactionFilterBarProps {
  filters?: TransactionFilters
  onFilterChange?: (filters: TransactionFilters) => void
  onResetFilters?: () => void
  categoryOptions?: CategoryOption[]
  className?: string
}

export const TransactionFilterBar: React.FC<TransactionFilterBarProps> = ({
  filters: controlledFilters,
  onFilterChange,
  onResetFilters,
  categoryOptions = [],
  className = '',
}) => {
  // Controlled vs Uncontrolled state
  const [internalFilters, setInternalFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)
  const filters = controlledFilters ?? internalFilters

  // Mobile collapse for advanced filters
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)

  const activeCount = countActiveFilters(filters)

  // Update helper
  const updateFilters = (patch: Partial<TransactionFilters>) => {
    const updated = { ...filters, ...patch }
    if (controlledFilters === undefined) {
      setInternalFilters(updated)
    }
    onFilterChange?.(updated)
  }

  // Handle preset date change
  const handleDatePresetChange = (preset: string) => {
    const range = getDatePresetRange(preset)
    const startDate = preset === 'custom' ? filters.startDate || '' : range.startDate
    const endDate = preset === 'custom' ? filters.endDate || '' : range.endDate

    updateFilters({
      datePreset: preset,
      startDate,
      endDate,
    })
  }

  // Handle Type Change with category conflict protection
  const handleTypeChange = (newType: TransactionTypeFilter) => {
    let newCategoryId = filters.categoryId
    // Nếu danh mục đang chọn không tương thích với loại mới thì reset category về 'all'
    if (newCategoryId !== 'all') {
      const selectedCategory = categoryOptions.find((c) => c.value === newCategoryId)
      if (newType !== 'all' && selectedCategory && selectedCategory.type !== newType) {
        newCategoryId = 'all'
      }
    }
    updateFilters({ type: newType, categoryId: newCategoryId })
  }

  // Reset all
  const handleReset = () => {
    if (controlledFilters === undefined) {
      setInternalFilters(DEFAULT_FILTERS)
    }
    onResetFilters?.()
    onFilterChange?.(DEFAULT_FILTERS)
  }

  // Filtered categories based on selected Type
  const availableCategories = categoryOptions.filter((cat) => {
    if (filters.type === 'income') return cat.type === 'income'
    if (filters.type === 'expense') return cat.type === 'expense'
    return true
  })

  // Định dạng danh sách lựa chọn cho Select Danh mục dùng chung (Đồng bộ chuẩn icon badge với TransactionModal)
  const categoryFilterOptions = React.useMemo(() => {
    return availableCategories.map((cat) => {
      const CatIcon = cat.icon || Layers
      const color = cat.color || '#64748B'
      return {
        value: cat.value,
        label: cat.label,
        icon: (
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
            style={getCategoryBadgeStyle(color)}
          >
            <CatIcon className="w-3.5 h-3.5" />
          </span>
        ),
      }
    })
  }, [availableCategories])

  // Định dạng danh sách lựa chọn cho Select Khoảng thời gian dùng chung
  const datePresetFilterOptions = React.useMemo(() => {
    return DATE_PRESET_OPTIONS.map((opt) => ({
      value: opt.value,
      label: opt.label,
      icon: (
        <span className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
          <Calendar className="w-3.5 h-3.5" />
        </span>
      ),
    }))
  }, [])

  return (
    <div
      className={`relative z-20 p-4 sm:p-5 rounded-3xl bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-[var(--glass-blur,20px)] border border-white/80 dark:border-slate-700/60 shadow-[0_8px_30px_rgba(15,23,42,0.04)] space-y-4 ${className}`}
    >
      {/* ========================================================================= */}
      {/* HÀNG 1: Ô TÌM KIẾM + PHÂN LOẠI THU/CHI + NÚT MỞ RỘNG TRÊN MOBILE */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
        {/* 1.1 Ô TÌM KIẾM NỘI DUNG / GHI CHÚ: DÙNG COMPONENT INPUT DÙNG CHUNG */}
        <div className="flex-1">
          <Input
            id="transaction-filter-search"
            type="text"
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            onClear={() => updateFilters({ search: '' })}
            placeholder="Tìm theo nội dung, ghi chú hoặc ID giao dịch..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* 1.2 SEGMENTED CONTROL: TẤT CẢ / THU / CHI */}
        <div className="flex items-center justify-between gap-2">
          <Tabs<TransactionTypeFilter>
            value={filters.type}
            onChange={handleTypeChange}
            size="sm"
            fullWidth
            containerClassName="flex-1 sm:flex-initial h-10"
            tabs={[
              {
                id: 'all',
                label: 'Tất cả',
                activeColor: 'default',
              },
              {
                id: 'income',
                label: '+ Thu',
                icon: <TrendingUp className="w-3.5 h-3.5" />,
                activeColor: 'emerald',
              },
              {
                id: 'expense',
                label: '- Chi',
                icon: <TrendingDown className="w-3.5 h-3.5" />,
                activeColor: 'rose',
              },
            ]}
          />

          {/* 1.3 NÚT BẬT/TẮT BỘ LỌC CHI TIẾT TRÊN MOBILE: DÙNG BUTTON & BADGE DÙNG CHUNG */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />}
            className="sm:hidden h-10 px-3.5 rounded-2xl border-white/80 dark:border-slate-700/60 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md shadow-2xs text-xs font-semibold shrink-0"
            aria-expanded={isMobileExpanded}
            aria-label="Bộ lọc nâng cao"
          >
            <span>Lọc</span>
            {activeCount > 0 && (
              <Badge
                variant="income"
                size="sm"
                className="ml-1 px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full !bg-emerald-600 !text-white"
              >
                {activeCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HÀNG 2: BỘ LỌC CHI TIẾT (DANH MỤC + KHOẢNG NGÀY + NÚT XÓA BỘ LỌC) */}
      {/* Responsive: luôn hiện trên desktop/tablet (sm:flex), toggle trên mobile */}
      {/* ========================================================================= */}
      <div
        className={`${
          isMobileExpanded ? 'flex' : 'hidden sm:flex'
        } flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/60 dark:border-slate-800/60`}
      >
        {/* 2.1 SELECT DANH MỤC: DÙNG COMPONENT SELECT DÙNG CHUNG */}
        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-[200px]">
          <Select
            id="filter-category-select"
            value={filters.categoryId}
            onChange={(val) => updateFilters({ categoryId: String(val) })}
            options={[
              {
                value: 'all',
                label: 'Tất cả danh mục',
                icon: (
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={getCategoryBadgeStyle(CATEGORY_COLORS.other)}
                  >
                    <Layers className="w-3.5 h-3.5" />
                  </span>
                ),
              },
              ...categoryFilterOptions,
            ]}
            placeholder="Tất cả danh mục"
          />
        </div>

        {/* 2.2 PRESET KHOẢNG NGÀY: DÙNG COMPONENT SELECT DÙNG CHUNG */}
        <div className="w-full sm:w-[210px]">
          <Select
            id="filter-date-preset-select"
            value={filters.datePreset}
            onChange={(val) => handleDatePresetChange(String(val))}
            options={datePresetFilterOptions}
            placeholder="Khoảng thời gian"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:min-w-[280px]">
          <Input
            id="transaction-filter-min-amount"
            label="Từ số tiền"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={filters.minAmount}
            onChange={(event) => updateFilters({ minAmount: event.target.value })}
            placeholder="Tối thiểu"
          />
          <Input
            id="transaction-filter-max-amount"
            label="Đến số tiền"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={filters.maxAmount}
            onChange={(event) => updateFilters({ maxAmount: event.target.value })}
            placeholder="Tối đa"
          />
        </div>

        {/* 2.3 CUSTOM DATE RANGE (Hiện khi chọn custom hoặc khi có ngày cụ thể) */}
        {filters.datePreset === 'custom' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto animate-in fade-in duration-150">
            <div className="w-full sm:w-36">
              <DatePicker
                mode="date"
                variant="input"
                size="sm"
                value={filters.startDate}
                placeholder="Từ ngày"
                onChange={(val) => updateFilters({ startDate: val })}
              />
            </div>
            <span className="hidden sm:inline text-slate-400 text-xs font-semibold px-0.5 text-center">-</span>
            <div className="w-full sm:w-36">
              <DatePicker
                mode="date"
                variant="input"
                size="sm"
                value={filters.endDate}
                placeholder="Đến ngày"
                minDate={filters.startDate}
                onChange={(val) => updateFilters({ endDate: val })}
              />
            </div>
          </div>
        )}

        {/* 2.4 ACTION XÓA BỘ LỌC (RESET): DÙNG BUTTON VÀ BADGE DÙNG CHUNG */}
        {activeCount > 0 && (
          <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto">
            <Button
              variant="danger"
              size="sm"
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="w-full sm:w-auto justify-center rounded-2xl"
              title="Đặt lại toàn bộ tiêu chí lọc"
            >
              <span>Xóa bộ lọc</span>
              <Badge
                variant="danger"
                size="sm"
                className="ml-0.5 px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold rounded-full"
              >
                {activeCount}
              </Badge>
            </Button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. DẤU HIỆU TRỰC QUAN: BADGE VÀ TAGS CÁC FILTER ĐANG HOẠT ĐỘNG */}
      {/* ========================================================================= */}
      {activeCount > 0 && (
        <div className="pt-3 border-t border-white/60 dark:border-slate-800/60 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đang lọc ({activeCount}):</span>
          </div>

          {/* Chip Tìm kiếm: Dùng Badge dùng chung */}
          {filters.search.trim() && (
            <Badge
              variant="neutral"
              size="md"
              onRemove={() => updateFilters({ search: '' })}
              className="rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80"
            >
              <span className="text-slate-500 font-normal">Từ khóa:</span>
              <strong className="font-medium truncate max-w-[120px] ml-1">
                "{filters.search}"
              </strong>
            </Badge>
          )}

          {/* Chip Phân loại: Dùng Badge dùng chung */}
          {filters.type !== 'all' && (
            <Badge
              variant={filters.type === 'income' ? 'income' : 'expense'}
              size="md"
              onRemove={() => handleTypeChange('all')}
              className="rounded-xl"
            >
              <span className="opacity-80 font-normal">Loại:</span>
              <strong className="font-semibold ml-1">
                {filters.type === 'income' ? '+ Thu nhập' : '- Chi tiêu'}
              </strong>
            </Badge>
          )}

          {/* Chip Danh mục: Dùng Badge dùng chung */}
          {filters.categoryId && filters.categoryId !== 'all' && (
            <Badge
              variant="neutral"
              size="md"
              onRemove={() => updateFilters({ categoryId: 'all' })}
              className="rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80"
            >
              <span className="text-slate-500 font-normal">Danh mục:</span>
              <strong className="font-medium ml-1">
                {categoryOptions.find((option) => option.value === filters.categoryId)?.label ?? 'Danh mục'}
              </strong>
            </Badge>
          )}

          {(filters.minAmount || filters.maxAmount) && (
            <Badge
              variant="neutral"
              size="md"
              onRemove={() => updateFilters({ minAmount: '', maxAmount: '' })}
              className="rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80"
            >
              <span className="text-slate-500 font-normal">Số tiền:</span>
              <strong className="font-medium ml-1">
                {filters.minAmount ? Number(filters.minAmount).toLocaleString('vi-VN') : '0'}
                {' - '}
                {filters.maxAmount ? Number(filters.maxAmount).toLocaleString('vi-VN') : 'không giới hạn'}
              </strong>
            </Badge>
          )}

          {/* Chip Thời gian: Dùng Badge dùng chung */}
          {(filters.datePreset !== 'all' || filters.startDate || filters.endDate) && (
            <Badge
              variant="neutral"
              size="md"
              onRemove={() =>
                updateFilters({ datePreset: 'all', startDate: '', endDate: '' })
              }
              className="rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80"
            >
              <span className="text-slate-500 font-normal">Thời gian:</span>
              <strong className="font-medium ml-1">
                {filters.datePreset === 'custom'
                  ? `${formatDateDisplay(filters.startDate)} - ${formatDateDisplay(filters.endDate)}`
                  : DATE_PRESET_OPTIONS.find((p) => p.value === filters.datePreset)?.label ||
                    filters.datePreset}
              </strong>
            </Badge>
          )}

          {/* Nút nhanh: Xóa tất cả dùng Button ghost */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-rose-600 transition-colors ml-auto font-medium h-auto p-1 hover:bg-transparent"
          >
            Đặt lại tất cả
          </Button>
        </div>
      )}
    </div>
  )
}
