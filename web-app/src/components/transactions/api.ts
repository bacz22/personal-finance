import Decimal from 'decimal.js'
import { safeMoney } from '../../money'
import {
  createOfflineTransaction,
  decimalMoney,
  deleteOfflineTransaction,
  getOfflineTransaction,
  listOfflineCategories,
  listOfflineTransactions,
  toMoneyString,
  updateOfflineTransaction,
} from '../../offline/repository'
import { CATEGORY_ICON_OPTIONS } from '../categories/palette'
import type { CategoryItem } from '../categories/types'
import type { CategoryOption, Transaction, TransactionFilters } from './types'

type ApiTransactionType = 'INCOME' | 'EXPENSE'

export interface ApiTransaction {
  id: string | number
  type: ApiTransactionType
  amount: number | string
  categoryId: string | number
  categoryName: string
  categoryIconKey: string
  categoryColor: string
  transactionDate: string
  title: string
  note?: string | null
  createdAt: string
  updatedAt: string
  version?: number
}

export interface ApiTransactionPage {
  items: ApiTransaction[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  totals: { income: number; expense: number; balance: number }
}

export interface TransactionPage {
  items: Transaction[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  totals: { income: number; expense: number; balance: number }
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
    amount: safeMoney(Number(transaction.amount)),
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
    amount: toMoneyString(draft.amount),
    categoryId: draft.categoryId,
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

function compareIdsDescending(left: string, right: string) {
  if (/^\d+$/.test(left) && /^\d+$/.test(right)) {
    const a = BigInt(left)
    const b = BigInt(right)
    return a > b ? -1 : a < b ? 1 : 0
  }
  return right.localeCompare(left)
}

function matchesSearch(transaction: ApiTransaction, search: string) {
  if (!search) return true
  return [transaction.title, transaction.note ?? '', transaction.categoryName, String(transaction.id)]
    .some((field) => field.toLocaleLowerCase('vi').includes(search))
}

export const transactionsApi = {
  list: async (filters: TransactionFilters, page: number, size: number): Promise<TransactionPage> => {
    const [transactions, categories] = await Promise.all([listOfflineTransactions(), listOfflineCategories()])
    const categoryById = new Map(categories.map((category) => [category.id, category]))
    let filtered: ApiTransaction[] = transactions.map((transaction) => ({
      ...transaction,
      id: transaction.id,
      amount: transaction.amount,
      categoryId: transaction.categoryId,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    }))
    const search = filters.search.trim().toLocaleLowerCase('vi')
    if (search) filtered = filtered.filter((transaction) => matchesSearch(transaction, search))
    if (filters.type !== 'all') filtered = filtered.filter((transaction) =>
      transaction.type === (filters.type === 'income' ? 'INCOME' : 'EXPENSE'),
    )
    if (filters.categoryId !== 'all') filtered = filtered.filter((transaction) => transaction.categoryId === filters.categoryId)
    if (filters.startDate) filtered = filtered.filter((transaction) => transaction.transactionDate >= filters.startDate!)
    if (filters.endDate) filtered = filtered.filter((transaction) => transaction.transactionDate <= filters.endDate!)
    if (filters.minAmount) filtered = filtered.filter((transaction) => decimalMoney(transaction.amount).greaterThanOrEqualTo(filters.minAmount))
    if (filters.maxAmount) filtered = filtered.filter((transaction) => decimalMoney(transaction.amount).lessThanOrEqualTo(filters.maxAmount))

    filtered.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || compareIdsDescending(String(a.id), String(b.id)))
    const income = filtered.filter((item) => item.type === 'INCOME')
      .reduce((sum, item) => sum.plus(item.amount), new Decimal(0))
    const expense = filtered.filter((item) => item.type === 'EXPENSE')
      .reduce((sum, item) => sum.plus(item.amount), new Decimal(0))
    const start = Math.max(0, (page - 1) * size)
    const items = filtered.slice(start, start + size).map((transaction) => {
      const category = categoryById.get(String(transaction.categoryId))
      return toUiTransaction({
        ...transaction,
        categoryName: category?.name ?? transaction.categoryName,
        categoryIconKey: category?.iconKey ?? transaction.categoryIconKey,
        categoryColor: category?.color ?? transaction.categoryColor,
      })
    })
    return {
      items,
      page,
      size,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
      totals: {
        income: safeMoney(income.toNumber()),
        expense: safeMoney(expense.toNumber()),
        balance: safeMoney(income.minus(expense).toNumber()),
      },
    }
  },

  get: async (transactionId: string): Promise<Transaction> => {
    const row = await getOfflineTransaction(transactionId)
    return toUiTransaction(row.data)
  },

  create: async (draft: TransactionDraft): Promise<Transaction> => {
    const category = (await listOfflineCategories()).find((item) => item.id === draft.categoryId)
    if (!category) throw new Error('Không tìm thấy danh mục đang chọn.')
    const request = toApiDraft(draft)
    const now = new Date().toISOString()
    const created = await createOfflineTransaction({
      ...request,
      type: request.type,
      amount: String(request.amount),
      categoryId: request.categoryId,
      categoryName: category.name,
      categoryIconKey: category.iconKey,
      categoryColor: category.color,
      transactionDate: request.transactionDate,
      title: request.title,
      note: request.note,
      createdAt: now,
      updatedAt: now,
    }, request)
    return toUiTransaction(created)
  },

  update: async (transactionId: string, draft: TransactionDraft): Promise<Transaction> => {
    const category = (await listOfflineCategories()).find((item) => item.id === draft.categoryId)
    if (!category) throw new Error('Không tìm thấy danh mục đang chọn.')
    const row = await getOfflineTransaction(transactionId)
    const request = toApiDraft(draft)
    const updated = await updateOfflineTransaction({
      ...row.data,
      ...request,
      amount: String(request.amount),
      categoryId: request.categoryId,
      categoryName: category.name,
      categoryIconKey: category.iconKey,
      categoryColor: category.color,
      updatedAt: new Date().toISOString(),
    }, request)
    return toUiTransaction(updated)
  },

  delete: (transactionId: string) => deleteOfflineTransaction(transactionId),
}
