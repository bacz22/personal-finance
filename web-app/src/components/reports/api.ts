import { MoreHorizontal } from 'lucide-react'
import { apiRequest } from '../../api'
import { safeMoney } from '../../money'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import {
  calculateComparisonRow,
  type CalculatedComparisonRow,
  type CategoryComparisonRow,
  type MonthSelection,
} from './types'

interface ApiComparisonCategory {
  categoryId: number
  categoryName: string
  categoryIconKey: string
  categoryColor: string
  monthAAmount: number
  monthBAmount: number
  diffAmount: number
  percentChange: number | null
}

interface ApiMonthlyComparisonResponse {
  monthA: string
  monthB: string
  totalMonthA: number
  totalMonthB: number
  diffAmount: number
  percentChange: number | null
  categoryBreakdown: ApiComparisonCategory[]
}

export interface MonthlyComparisonData {
  monthA: string
  monthB: string
  totalMonthA: number
  totalMonthB: number
  diffAmount: number
  percentChange: number | null
  categoryBreakdown: CalculatedComparisonRow[]
}

function finiteAmount(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function monthValue(selection: MonthSelection): string {
  return `${selection.year}-${String(selection.month).padStart(2, '0')}`
}

function toCategoryRow(category: ApiComparisonCategory): CalculatedComparisonRow {
  const icon = CATEGORY_ICON_OPTIONS.find((option) => option.id === category.categoryIconKey)?.icon
    ?? MoreHorizontal
  const row: CategoryComparisonRow = {
    id: String(category.categoryId),
    categoryName: category.categoryName,
    categoryIcon: icon,
    categoryColor: category.categoryColor,
    monthAAmount: safeMoney(category.monthAAmount),
    monthBAmount: safeMoney(category.monthBAmount),
  }
  return calculateComparisonRow(row)
}

export const reportsApi = {
  compareMonths: async (monthA: MonthSelection, monthB: MonthSelection): Promise<MonthlyComparisonData> => {
    const params = new URLSearchParams({
      monthA: monthValue(monthA),
      monthB: monthValue(monthB),
    })
    const response = await apiRequest<ApiMonthlyComparisonResponse>(
      `/api/v1/reports/monthly-comparison?${params.toString()}`,
    )

    return {
      monthA: response.monthA,
      monthB: response.monthB,
      totalMonthA: safeMoney(response.totalMonthA),
      totalMonthB: safeMoney(response.totalMonthB),
      diffAmount: safeMoney(response.diffAmount),
      percentChange: response.percentChange === null || response.percentChange === undefined
        ? null
        : finiteAmount(response.percentChange),
      categoryBreakdown: (response.categoryBreakdown ?? []).map(toCategoryRow),
    }
  },
}
