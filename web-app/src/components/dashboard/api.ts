import { MoreHorizontal } from 'lucide-react'
import { apiRequest } from '../../api'
import { safeMoney } from '../../money'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import { toUiTransaction, type ApiTransaction } from '../transactions/api'
import type { Transaction } from '../transactions/types'
import type { DailyExpenseItem } from './DailyExpenseTrend'
import type { ExpenseCategoryItem } from './CategoryExpenseChart'

interface ApiDashboardResponse {
  month: string
  income: number
  expense: number
  balance: number
  savingsRate: number | null
  transactionCount: number
  categoryBreakdown: Array<{
    id: number
    categoryName: string
    categoryIconKey: string
    categoryColor: string
    amount: number
  }>
  dailyExpenses: DailyExpenseItem[]
  recentTransactions: ApiTransaction[]
  previousMonthExpense: number
}

export interface DashboardData {
  month: string
  income: number
  expense: number
  balance: number
  savingsRate: number | null
  transactionCount: number
  categoryBreakdown: ExpenseCategoryItem[]
  dailyExpenses: DailyExpenseItem[]
  recentTransactions: Transaction[]
  previousMonthExpense: number
}

export const dashboardApi = {
  get: async (month: number, year: number): Promise<DashboardData> => {
    const monthValue = `${year}-${String(month).padStart(2, '0')}`
    const response = await apiRequest<ApiDashboardResponse>(
      `/api/v1/dashboard?month=${encodeURIComponent(monthValue)}`,
    )

    return {
      ...response,
      income: safeMoney(response.income),
      expense: safeMoney(response.expense),
      balance: safeMoney(response.balance),
      previousMonthExpense: safeMoney(response.previousMonthExpense),
      categoryBreakdown: response.categoryBreakdown.map((category) => ({
        id: String(category.id),
        name: category.categoryName,
        icon: CATEGORY_ICON_OPTIONS.find((option) => option.id === category.categoryIconKey)?.icon
          ?? MoreHorizontal,
        color: category.categoryColor,
        amount: safeMoney(category.amount),
      })),
      dailyExpenses: response.dailyExpenses.map((day) => ({
        ...day,
        amount: safeMoney(day.amount),
      })),
      recentTransactions: response.recentTransactions.map(toUiTransaction),
    }
  },
}
