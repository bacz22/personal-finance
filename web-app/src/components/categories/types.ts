import { type LucideIcon } from 'lucide-react'

export type CategoryType = 'expense' | 'income'
export type CategoryStatus = 'active' | 'inactive'

export interface CategoryItem {
  id: string
  name: string
  type: CategoryType
  icon: LucideIcon
  color: string // Hex color
  status: CategoryStatus
  transactionCount?: number
  description?: string
}

export interface CategoryDraft {
  name: string
  type: CategoryType
  icon: LucideIcon
  color: string
  description?: string
}

export interface CategoryFilterState {
  type: 'all' | CategoryType
  status: 'all' | CategoryStatus
  searchQuery: string
}
