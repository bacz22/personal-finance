import Decimal from 'decimal.js'
import { MoreHorizontal } from 'lucide-react'
import { safeMoney } from '../../money'
import { listOfflineCategories, listOfflineTransactions } from '../../offline/repository'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import type {
  CalculatedComparisonRow,
  MonthSelection,
} from './types'

export interface MonthlyComparisonData {
  monthA: string
  monthB: string
  totalMonthA: number
  totalMonthB: number
  diffAmount: number
  percentChange: number | null
  categoryBreakdown: CalculatedComparisonRow[]
}

function monthValue(selection: MonthSelection) {
  return `${selection.year}-${String(selection.month).padStart(2, '0')}`
}

function amount(value: Decimal) {
  return safeMoney(value.toNumber())
}

function percentChange(baseline: Decimal, comparison: Decimal): number | null {
  if (baseline.isZero()) return null
  return comparison.minus(baseline).div(baseline).mul(100)
    .toDecimalPlaces(1, Decimal.ROUND_HALF_UP).toNumber()
}

function descendingId(left: string, right: string) {
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) {
    const a = BigInt(left)
    const b = BigInt(right)
    return a < b ? -1 : a > b ? 1 : 0
  }
  return left.localeCompare(right)
}

export const reportsApi = {
  compareMonths: async (monthA: MonthSelection, monthB: MonthSelection): Promise<MonthlyComparisonData> => {
    const [transactions, categories] = await Promise.all([listOfflineTransactions(), listOfflineCategories()])
    const valueA = monthValue(monthA)
    const valueB = monthValue(monthB)
    const categoriesById = new Map(categories.map((category) => [category.id, category]))
    const totalsByCategory = new Map<string, { monthA: Decimal; monthB: Decimal; name: string; iconKey: string; color: string }>()
    for (const transaction of transactions) {
      if (transaction.type !== 'EXPENSE') continue
      const targetMonth = transaction.transactionDate.startsWith(valueA)
        ? 'monthA'
        : transaction.transactionDate.startsWith(valueB) ? 'monthB' : null
      if (!targetMonth) continue
      const category = categoriesById.get(transaction.categoryId)
      const totals = totalsByCategory.get(transaction.categoryId) ?? {
        monthA: new Decimal(0),
        monthB: new Decimal(0),
        name: category?.name ?? transaction.categoryName,
        iconKey: category?.iconKey ?? transaction.categoryIconKey,
        color: category?.color ?? transaction.categoryColor,
      }
      totals[targetMonth] = totals[targetMonth].plus(transaction.amount)
      totalsByCategory.set(transaction.categoryId, totals)
    }

    const rows = [...totalsByCategory.entries()].map(([id, totals]) => {
      const diff = totals.monthB.minus(totals.monthA)
      const monthAAmount = amount(totals.monthA)
      const monthBAmount = amount(totals.monthB)
      const diffAmount = amount(diff)
      const change = percentChange(totals.monthA, totals.monthB)
      return {
        id,
        categoryName: totals.name,
        categoryIcon: CATEGORY_ICON_OPTIONS.find((option) => option.id === totals.iconKey)?.icon ?? MoreHorizontal,
        categoryColor: totals.color,
        monthAAmount,
        monthBAmount,
        diffAmount,
        percentChange: change,
        isNew: totals.monthA.isZero() && totals.monthB.greaterThan(0),
        isIncreased: diff.greaterThan(0),
        isDecreased: diff.lessThan(0),
      } satisfies CalculatedComparisonRow
    }).sort((a, b) => {
      const maximumA = Math.max(a.monthAAmount, a.monthBAmount)
      const maximumB = Math.max(b.monthAAmount, b.monthBAmount)
      return maximumB - maximumA
        || a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: 'base' })
        || descendingId(a.id, b.id)
    })
    const totalMonthA = rows.reduce((sum, row) => sum.plus(row.monthAAmount), new Decimal(0))
    const totalMonthB = rows.reduce((sum, row) => sum.plus(row.monthBAmount), new Decimal(0))
    const diffAmount = totalMonthB.minus(totalMonthA)
    return {
      monthA: valueA,
      monthB: valueB,
      totalMonthA: amount(totalMonthA),
      totalMonthB: amount(totalMonthB),
      diffAmount: amount(diffAmount),
      percentChange: percentChange(totalMonthA, totalMonthB),
      categoryBreakdown: rows,
    }
  },
}
