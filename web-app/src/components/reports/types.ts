import { type LucideIcon } from 'lucide-react'
import { CHART_TOKENS } from '../../tokens'

export interface MonthSelection {
  month: number // 1 - 12
  year: number
}

export const MONTH_A_COLOR = CHART_TOKENS.monthA // Kỳ gốc (Tháng A)
export const MONTH_B_COLOR = CHART_TOKENS.monthB // Kỳ so sánh (Tháng B)

export interface CategoryComparisonRow {
  id: string
  categoryName: string
  categoryIcon: LucideIcon
  categoryColor: string
  monthAAmount: number // Chi tiêu Tháng A (Kỳ gốc)
  monthBAmount: number // Chi tiêu Tháng B (Kỳ so sánh)
}

export interface CalculatedComparisonRow extends CategoryComparisonRow {
  diffAmount: number
  percentChange: number | null // null nếu monthAAmount === 0 -> "Mới phát sinh"
  isNew: boolean
  isIncreased: boolean
  isDecreased: boolean
}

export interface ComparisonSummaryStats {
  totalMonthA: number
  totalMonthB: number
  diffAmount: number
  percentChange: number | null
  isIncreased: boolean
  isDecreased: boolean
  highestIncreaseCategory: { name: string; amount: number; percent: number | null } | null
  highestSavingCategory: { name: string; amount: number; percent: number | null } | null
}

export function formatMonthLabel(month: number, year: number): string {
  return `Tháng ${String(month).padStart(2, '0')}/${year}`
}

export function calculateComparisonRow(row: CategoryComparisonRow): CalculatedComparisonRow {
  const diffAmount = row.monthBAmount - row.monthAAmount
  const isNew = row.monthAAmount === 0 && row.monthBAmount > 0
  const percentChange =
    row.monthAAmount > 0
      ? Math.round(((row.monthBAmount - row.monthAAmount) / row.monthAAmount) * 1000) / 10
      : null

  return {
    ...row,
    diffAmount,
    percentChange,
    isNew,
    isIncreased: diffAmount > 0,
    isDecreased: diffAmount < 0,
  }
}

export function calculateComparisonSummary(rows: CalculatedComparisonRow[]): ComparisonSummaryStats {
  const totalMonthA = rows.reduce((sum, r) => sum + r.monthAAmount, 0)
  const totalMonthB = rows.reduce((sum, r) => sum + r.monthBAmount, 0)
  const diffAmount = totalMonthB - totalMonthA
  const percentChange =
    totalMonthA > 0
      ? Math.round(((totalMonthB - totalMonthA) / totalMonthA) * 1000) / 10
      : null

  // Tìm danh mục tăng nhiều nhất và danh mục tiết kiệm nhiều nhất
  let maxIncrease: { name: string; amount: number; percent: number | null } | null = null
  let maxSaving: { name: string; amount: number; percent: number | null } | null = null

  for (const row of rows) {
    if (row.diffAmount > 0) {
      if (!maxIncrease || row.diffAmount > maxIncrease.amount) {
        maxIncrease = {
          name: row.categoryName,
          amount: row.diffAmount,
          percent: row.percentChange,
        }
      }
    } else if (row.diffAmount < 0) {
      const savingAmount = Math.abs(row.diffAmount)
      if (!maxSaving || savingAmount > maxSaving.amount) {
        maxSaving = {
          name: row.categoryName,
          amount: savingAmount,
          percent: row.percentChange !== null ? Math.abs(row.percentChange) : null,
        }
      }
    }
  }

  return {
    totalMonthA,
    totalMonthB,
    diffAmount,
    percentChange,
    isIncreased: diffAmount > 0,
    isDecreased: diffAmount < 0,
    highestIncreaseCategory: maxIncrease,
    highestSavingCategory: maxSaving,
  }
}
