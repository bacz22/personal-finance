import { safeMoney } from '../../money'
import {
  createOfflineBudget,
  deleteOfflineBudget,
  listOfflineBudgets,
  listOfflineCategories,
  toMoneyString,
  updateOfflineBudget,
} from '../../offline/repository'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import type { BudgetDraft, BudgetItem } from './types'

interface ApiBudget {
  id: string
  month: string
  categoryId: string
  categoryName: string
  categoryIconKey: string
  categoryColor: string
  limitAmount: number | string
  spent: number | string
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
    budgetLimit: safeMoney(Number(budget.limitAmount)),
    spent: safeMoney(Number(budget.spent)),
    month,
    year,
  }
}

function monthKey(month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function toApiRequest(draft: BudgetDraft) {
  return {
    month: draft.month,
    categoryId: String(draft.categoryId),
    limitAmount: toMoneyString(draft.limitAmount),
  }
}

async function toOfflineBudgetData(id: string, draft: BudgetDraft) {
  const categoryId = String(draft.categoryId)
  const category = (await listOfflineCategories()).find((item) => item.id === categoryId)
  if (!category) throw new Error('Không tìm thấy danh mục đang chọn.')
  return {
    id,
    month: draft.month,
    categoryId,
    categoryName: category.name,
    categoryIconKey: category.iconKey,
    categoryColor: category.color,
    limitAmount: toMoneyString(draft.limitAmount),
  }
}

export const budgetsApi = {
  list: async (month: number, year: number): Promise<BudgetItem[]> =>
    (await listOfflineBudgets(monthKey(month, year))).map(toUiBudget),

  create: async (draft: BudgetDraft): Promise<BudgetItem> => {
    const data = await toOfflineBudgetData('', draft)
    const budget = await createOfflineBudget(data, toApiRequest(draft))
    const recalculated = (await listOfflineBudgets(draft.month)).find((item) => item.id === budget.id)
    return toUiBudget({ ...budget, spent: recalculated?.spent ?? '0.00' })
  },

  update: async (id: string, draft: BudgetDraft): Promise<BudgetItem> => {
    const data = await toOfflineBudgetData(id, draft)
    const budget = await updateOfflineBudget(data, toApiRequest(draft))
    const recalculated = (await listOfflineBudgets(draft.month)).find((item) => item.id === id)
    return toUiBudget({ ...budget, spent: recalculated?.spent ?? '0.00' })
  },

  delete: (id: string) => deleteOfflineBudget(id),
}
