import { apiRequest } from '../../api'
import { safeMoney } from '../../money'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import type { BudgetDraft, BudgetItem } from './types'

interface ApiBudget {
  id: number
  month: string
  categoryId: number
  categoryName: string
  categoryIconKey: string
  categoryColor: string
  limitAmount: number
  spent: number
}

function toUiBudget(budget: ApiBudget): BudgetItem {
  const [year, month] = budget.month.split('-').map(Number)
  return {
    id: String(budget.id),
    categoryId: String(budget.categoryId),
    categoryName: budget.categoryName,
    categoryIcon: CATEGORY_ICON_OPTIONS.find((option) => option.id === budget.categoryIconKey)?.icon
      ?? CATEGORY_ICON_OPTIONS.find((option) => option.id === 'more-horizontal')!.icon,
    categoryColor: budget.categoryColor,
    budgetLimit: safeMoney(budget.limitAmount),
    spent: safeMoney(budget.spent),
    month,
    year,
  }
}

function toApiRequest(draft: BudgetDraft) {
  return {
    month: draft.month,
    categoryId: draft.categoryId,
    limitAmount: safeMoney(draft.limitAmount),
  }
}

export const budgetsApi = {
  list: async (month: number, year: number): Promise<BudgetItem[]> => {
    const monthValue = `${year}-${String(month).padStart(2, '0')}`
    const budgets = await apiRequest<ApiBudget[]>(`/api/v1/budgets?month=${encodeURIComponent(monthValue)}`)
    return budgets.map(toUiBudget)
  },

  create: async (draft: BudgetDraft): Promise<BudgetItem> => {
    const budget = await apiRequest<ApiBudget>('/api/v1/budgets', {
      method: 'POST',
      body: JSON.stringify(toApiRequest(draft)),
    })
    return toUiBudget(budget)
  },

  update: async (id: string, draft: BudgetDraft): Promise<BudgetItem> => {
    const budget = await apiRequest<ApiBudget>(`/api/v1/budgets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(toApiRequest(draft)),
    })
    return toUiBudget(budget)
  },

  delete: (id: string) =>
    apiRequest<void>(`/api/v1/budgets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
