import type { LucideIcon } from 'lucide-react'

export type TransactionTypeFilter = 'all' | 'income' | 'expense'

export interface TransactionFilters {
  search: string
  type: TransactionTypeFilter
  categoryId: string
  datePreset: string
  startDate?: string
  endDate?: string
  minAmount: string
  maxAmount: string
}

export const DEFAULT_FILTERS: TransactionFilters = {
  search: '',
  type: 'all',
  categoryId: 'all',
  datePreset: 'all',
  startDate: '',
  endDate: '',
  minAmount: '',
  maxAmount: '',
}

export interface Transaction {
  id: string
  title: string
  categoryId: string
  category: string
  categoryIcon?: LucideIcon
  categoryColor?: string
  amount: number
  type: 'income' | 'expense'
  date: string
  account?: string
  note?: string
}

export interface CategoryOption {
  value: string
  label: string
  type: 'income' | 'expense'
  icon?: LucideIcon
  color?: string
  active?: boolean
}

export const DATE_PRESET_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: 'this_month', label: 'Tháng này' },
  { value: 'last_month', label: 'Tháng trước' },
  { value: 'last_7_days', label: '7 ngày gần nhất' },
  { value: 'last_30_days', label: '30 ngày gần nhất' },
  { value: 'custom', label: 'Tùy chỉnh khoảng ngày...' },
]

export function getDatePresetRange(preset: string, now = new Date()) {
  const format = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (preset === 'this_month') {
    return { startDate: format(new Date(today.getFullYear(), today.getMonth(), 1)), endDate: format(today) }
  }
  if (preset === 'last_month') {
    return {
      startDate: format(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
      endDate: format(new Date(today.getFullYear(), today.getMonth(), 0)),
    }
  }
  if (preset === 'last_7_days' || preset === 'last_30_days') {
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - (preset === 'last_7_days' ? 6 : 29))
    return { startDate: format(startDate), endDate: format(today) }
  }
  return { startDate: '', endDate: '' }
}

export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0
  if (filters.search.trim()) count++
  if (filters.type !== 'all') count++
  if (filters.categoryId && filters.categoryId !== 'all') count++
  if (filters.datePreset !== 'all' || filters.startDate || filters.endDate) count++
  if (filters.minAmount || filters.maxAmount) count++
  return count
}
