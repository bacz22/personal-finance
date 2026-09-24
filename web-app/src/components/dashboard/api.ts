import Decimal from 'decimal.js'
import { MoreHorizontal } from 'lucide-react'
import { safeMoney } from '../../money'
import { listOfflineCategories, listOfflineTransactions } from '../../offline/repository'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import { toUiTransaction } from '../transactions/api'
import type { Transaction } from '../transactions/types'
import type { DailyExpenseItem } from './DailyExpenseTrend'
import type { ExpenseCategoryItem } from './CategoryExpenseChart'

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

function sum(rows: Array<{ amount: string | number }>) {
  return rows.reduce((total, row) => total.plus(row.amount), new Decimal(0))
}

function money(value: Decimal) {
  return safeMoney(value.toNumber())
}

function monthKey(month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

function previousMonthKey(month: number, year: number) {
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}

function idDescending(left: string, right: string) {
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) {
    const a = BigInt(left)
    const b = BigInt(right)
    return a > b ? -1 : a < b ? 1 : 0
  }
  return right.localeCompare(left)
}

export const dashboardApi = {
  get: async (month: number, year: number): Promise<DashboardData> => {
    const [transactions, categories] = await Promise.all([listOfflineTransactions(), listOfflineCategories()])
    const selectedMonth = monthKey(month, year)
    const monthRows = transactions.filter((transaction) => transaction.transactionDate.startsWith(selectedMonth))
    const incomeRows = monthRows.filter((transaction) => transaction.type === 'INCOME')
    const expenseRows = monthRows.filter((transaction) => transaction.type === 'EXPENSE')
    const income = sum(incomeRows)
    const expense = sum(expenseRows)
    const balance = income.minus(expense)
    const amountByCategory = new Map<string, Decimal>()
    const amountByDay = new Map<number, Decimal>()
    for (const transaction of expenseRows) {
      amountByCategory.set(
        transaction.categoryId,
        (amountByCategory.get(transaction.categoryId) ?? new Decimal(0)).plus(transaction.amount),
      )
      const day = Number(transaction.transactionDate.slice(-2))
      amountByDay.set(day, (amountByDay.get(day) ?? new Decimal(0)).plus(transaction.amount))
    }
    const categoryById = new Map(categories.map((category) => [category.id, category]))
    const categoryBreakdown: ExpenseCategoryItem[] = [...amountByCategory.entries()]
      .sort((a, b) => b[1].comparedTo(a[1]))
      .map(([categoryId, categoryAmount]) => {
        const category = categoryById.get(categoryId)
        return {
          id: categoryId,
          name: category?.name ?? 'Danh mục đã lưu trữ',
          color: category?.color ?? '#64748B',
          icon: CATEGORY_ICON_OPTIONS.find((option) => option.id === category?.iconKey)?.icon ?? MoreHorizontal,
          amount: money(categoryAmount),
        }
      })
    const days = new Date(year, month, 0).getDate()
    const dailyExpenses: DailyExpenseItem[] = expense.isZero() ? [] : Array.from({ length: days }, (_, index) => {
      const day = index + 1
      return {
        date: `${selectedMonth}-${String(day).padStart(2, '0')}`,
        day,
        amount: money(amountByDay.get(day) ?? new Decimal(0)),
      }
    })
    const recentTransactions = [...monthRows]
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || idDescending(a.id, b.id))
      .slice(0, 8)
      .map(toUiTransaction)
    const previousMonthExpense = sum(transactions.filter((transaction) =>
      transaction.type === 'EXPENSE' && transaction.transactionDate.startsWith(previousMonthKey(month, year)),
    ))
    const savingsRate = income.isZero()
      ? null
      : balance.div(income).mul(100).toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber()

    return {
      month: selectedMonth,
      income: money(income),
      expense: money(expense),
      balance: money(balance),
      savingsRate,
      transactionCount: monthRows.length,
      categoryBreakdown,
      dailyExpenses,
      recentTransactions,
      previousMonthExpense: money(previousMonthExpense),
    }
  },
}
