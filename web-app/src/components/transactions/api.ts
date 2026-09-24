import { apiRequest } from '../../api'
import { safeMoney } from '../../money'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import type { CategoryItem } from '../categories/types'
import type { CategoryOption, Transaction, TransactionFilters } from './types'

type ApiTransactionType = 'INCOME' | 'EXPENSE'

export interface ApiTransaction {
  id: number
  type: ApiTransactionType
  amount: number
  categoryId: number
  categoryName: string
  categoryIconKey: string
  categoryColor: string
  transactionDate: string
  title: string
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface ApiTransactionPage {
  items: ApiTransaction[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  totals: {
    income: number
    expense: number
    balance: number
  }
}

export interface TransactionPage {
  items: Transaction[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  totals: {
    income: number
    expense: number
    balance: number
  }
}

export interface TransactionDraft {
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  transactionDate: string
  title: string
  note?: string
}

export function toUiTransaction(transaction: ApiTransaction): Transaction {
  const icon = CATEGORY_ICON_OPTIONS.find((option) => option.id === transaction.categoryIconKey)
  return {
    id: String(transaction.id),
    title: transaction.title,
    categoryId: String(transaction.categoryId),
    category: transaction.categoryName,
    categoryIcon: icon?.icon,
    categoryColor: transaction.categoryColor,
    amount: safeMoney(transaction.amount),
    type: transaction.type === 'INCOME' ? 'income' : 'expense',
    date: transaction.transactionDate,
    note: transaction.note || undefined,
  }
}

function toApiType(type: TransactionDraft['type']): ApiTransactionType {
  return type === 'income' ? 'INCOME' : 'EXPENSE'
}

function toApiDraft(draft: TransactionDraft) {
  return {
    type: toApiType(draft.type),
    amount: safeMoney(draft.amount),
    categoryId: Number(draft.categoryId),
    transactionDate: draft.transactionDate,
    title: draft.title.trim(),
    note: draft.note?.trim() || null,
  }
}

export function toTransactionCategoryOptions(categories: CategoryItem[]): CategoryOption[] {
  return categories.map((category) => ({
    value: category.id,
    label: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    active: category.status === 'active',
  }))
}

export const transactionsApi = {
  list: async (
    filters: TransactionFilters,
    page: number,
    size: number,
  ): Promise<TransactionPage> => {
    const params = new URLSearchParams({ page: String(page), size: String(size) })
    const search = filters.search.trim()
    if (search) params.set('search', search)
    if (filters.type !== 'all') params.set('type', toApiType(filters.type))
    if (filters.categoryId !== 'all') params.set('categoryId', filters.categoryId)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.minAmount) params.set('minAmount', filters.minAmount)
    if (filters.maxAmount) params.set('maxAmount', filters.maxAmount)

    const response = await apiRequest<ApiTransactionPage>(`/api/v1/transactions?${params.toString()}`)
    return {
      ...response,
      items: response.items.map(toUiTransaction),
      totals: {
        income: safeMoney(response.totals.income),
        expense: safeMoney(response.totals.expense),
        balance: safeMoney(response.totals.balance),
      },
    }
  },

  get: async (transactionId: string): Promise<Transaction> => {
    const response = await apiRequest<ApiTransaction>(`/api/v1/transactions/${transactionId}`)
    return toUiTransaction(response)
  },

  create: async (draft: TransactionDraft): Promise<Transaction> => {
    const response = await apiRequest<ApiTransaction>('/api/v1/transactions', {
      method: 'POST',
      body: JSON.stringify(toApiDraft(draft)),
    })
    return toUiTransaction(response)
  },

  update: async (transactionId: string, draft: TransactionDraft): Promise<Transaction> => {
    const response = await apiRequest<ApiTransaction>(`/api/v1/transactions/${transactionId}`, {
      method: 'PUT',
      body: JSON.stringify(toApiDraft(draft)),
    })
    return toUiTransaction(response)
  },

  delete: (transactionId: string) =>
    apiRequest<void>(`/api/v1/transactions/${transactionId}`, { method: 'DELETE' }),
}
