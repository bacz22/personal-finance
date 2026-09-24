import type { LucideIcon } from 'lucide-react'

export type BudgetStatus = 'safe' | 'warning' | 'exceeded'

export interface BudgetItem {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon: LucideIcon
  categoryColor: string
  budgetLimit: number // Hạn mức (VND)
  spent: number // Đã chi (VND)
  month: number // 1 - 12
  year: number
}

export interface BudgetDraft {
  month: string
  categoryId: number
  limitAmount: number
}

export interface ExpenseCategoryOption {
  value: string
  label: string
  icon: LucideIcon
  color: string
}

export interface BudgetCalculatedItem extends BudgetItem {
  remaining: number
  percent: number
  status: BudgetStatus
  statusLabel: string
}

export function calculateBudgetStats(item: BudgetItem): BudgetCalculatedItem {
  const remaining = item.budgetLimit - item.spent
  const ratio = item.budgetLimit > 0 ? item.spent / item.budgetLimit : 0
  // Truncate to one decimal so the displayed percentage never crosses a status threshold early.
  const percent = Math.floor(ratio * 1000) / 10

  let status: BudgetStatus = 'safe'
  let statusLabel = 'An toàn'

  if (ratio >= 1) {
    status = 'exceeded'
    statusLabel = 'Đã vượt hạn mức'
  } else if (ratio >= 0.7) {
    status = 'warning'
    statusLabel = 'Sắp chạm giới hạn'
  }

  return {
    ...item,
    remaining,
    percent,
    status,
    statusLabel,
  }
}
