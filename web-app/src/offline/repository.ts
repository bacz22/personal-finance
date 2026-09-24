import Decimal from 'decimal.js'
import { getActiveUserId, getUserRows, openOfflineDatabase } from './database'
import { ensureSnapshot, createLocalRecord, updateLocalRecord, deleteLocalRecord } from './syncEngine'
import type {
  OfflineBudgetData,
  OfflineCategoryData,
  OfflineRecord,
  OfflineTransactionData,
} from './types'

function activeUserId() {
  const userId = getActiveUserId()
  if (!userId) throw new Error('Chưa có tài khoản đang hoạt động.')
  return userId
}

export async function listOfflineCategories() {
  await ensureSnapshot()
  const userId = activeUserId()
  const [rows, transactionRows] = await Promise.all([
    getUserRows('categories', userId) as Promise<OfflineRecord<OfflineCategoryData>[]>,
    getUserRows('transactions', userId) as Promise<OfflineRecord<OfflineTransactionData>[]>,
  ])
  const counts = new Map<string, number>()
  for (const row of transactionRows) {
    if (row.deleted) continue
    counts.set(row.data.categoryId, (counts.get(row.data.categoryId) ?? 0) + 1)
  }
  return rows.filter((row) => !row.deleted).map((row) => ({
    ...row.data,
    transactionCount: counts.get(row.id) ?? 0,
  }))
}

export async function getOfflineCategory(id: string) {
  const userId = activeUserId()
  await ensureSnapshot()
  const database = await openOfflineDatabase()
  const row = await database.get('categories', [userId, id])
  if (!row || row.deleted) throw new Error('Không tìm thấy danh mục trên thiết bị.')
  return row as OfflineRecord<OfflineCategoryData>
}

export async function createOfflineCategory(data: Omit<OfflineCategoryData, 'id' | 'transactionCount'>, payload: Record<string, unknown>) {
  const created = await createLocalRecord(
    'CATEGORY',
    (id) => ({ ...data, id, transactionCount: 0 }),
    payload,
  )
  return created.data as OfflineCategoryData
}

export async function updateOfflineCategory(data: OfflineCategoryData, payload: Record<string, unknown>) {
  const record = await getOfflineCategory(data.id)
  const updated = await updateLocalRecord({
    entityType: 'CATEGORY',
    localId: data.id,
    data,
    payload,
  })
  return { ...updated, data: { ...data, transactionCount: record.data.transactionCount } }
}

export async function deactivateOfflineCategory(id: string) {
  const record = await getOfflineCategory(id)
  const updatedData = { ...record.data, active: false }
  await deleteLocalRecord('CATEGORY', id, updatedData)
  return updatedData
}

export async function listOfflineTransactions() {
  await ensureSnapshot()
  const userId = activeUserId()
  const [rows, categories] = await Promise.all([
    getUserRows('transactions', userId) as Promise<OfflineRecord<OfflineTransactionData>[]>,
    getUserRows('categories', userId) as Promise<OfflineRecord<OfflineCategoryData>[]>,
  ])
  const categoryById = new Map(categories.map((row) => [row.id, row.data]))
  return rows.filter((row) => !row.deleted).map((row) => {
    const category = categoryById.get(row.data.categoryId)
    return {
      ...row.data,
      categoryName: category?.name ?? row.data.categoryName,
      categoryIconKey: category?.iconKey ?? row.data.categoryIconKey,
      categoryColor: category?.color ?? row.data.categoryColor,
    }
  })
}

export async function getOfflineTransaction(id: string) {
  const userId = activeUserId()
  await ensureSnapshot()
  const database = await openOfflineDatabase()
  const row = await database.get('transactions', [userId, id])
  if (!row || row.deleted) throw new Error('Không tìm thấy giao dịch trên thiết bị.')
  return row as OfflineRecord<OfflineTransactionData>
}

export async function createOfflineTransaction(
  data: Omit<OfflineTransactionData, 'id'>,
  payload: Record<string, unknown>,
) {
  const created = await createLocalRecord(
    'TRANSACTION', (id) => ({ ...data, id }), payload,
  )
  return created.data as OfflineTransactionData
}

export async function updateOfflineTransaction(data: OfflineTransactionData, payload: Record<string, unknown>) {
  await getOfflineTransaction(data.id)
  const updated = await updateLocalRecord({ entityType: 'TRANSACTION', localId: data.id, data, payload })
  return updated.data as OfflineTransactionData
}

export async function deleteOfflineTransaction(id: string) {
  await getOfflineTransaction(id)
  return deleteLocalRecord('TRANSACTION', id)
}

export async function listOfflineBudgets(month?: string) {
  await ensureSnapshot()
  const userId = activeUserId()
  const [rows, transactionRows, categories] = await Promise.all([
    getUserRows('budgets', userId) as Promise<OfflineRecord<OfflineBudgetData>[]>,
    getUserRows('transactions', userId) as Promise<OfflineRecord<OfflineTransactionData>[]>,
    getUserRows('categories', userId) as Promise<OfflineRecord<OfflineCategoryData>[]>,
  ])
  const categoryById = new Map(categories.map((row) => [row.id, row.data]))
  const liveTransactions = transactionRows.filter((row) => !row.deleted && row.data.type === 'EXPENSE')
  return rows.filter((row) => !row.deleted && (!month || row.data.month === month)).map((row) => {
    const category = categoryById.get(row.data.categoryId)
    const spent = liveTransactions
      .filter((transaction) => transaction.data.categoryId === row.data.categoryId
        && transaction.data.transactionDate.startsWith(row.data.month))
      .reduce((sum, transaction) => sum.plus(transaction.data.amount), new Decimal(0))
    return {
      ...row.data,
      categoryName: category?.name ?? row.data.categoryName,
      categoryIconKey: category?.iconKey ?? row.data.categoryIconKey,
      categoryColor: category?.color ?? row.data.categoryColor,
      spent: spent.toFixed(2),
    }
  })
}

export async function getOfflineBudget(id: string) {
  const userId = activeUserId()
  await ensureSnapshot()
  const database = await openOfflineDatabase()
  const row = await database.get('budgets', [userId, id])
  if (!row || row.deleted) throw new Error('Không tìm thấy ngân sách trên thiết bị.')
  return row as OfflineRecord<OfflineBudgetData>
}

export async function createOfflineBudget(
  data: Omit<OfflineBudgetData, 'id' | 'spent'>,
  payload: Record<string, unknown>,
) {
  const created = await createLocalRecord(
    'BUDGET', (id) => ({ ...data, id, spent: '0.00' }), payload,
  )
  return created.data as OfflineBudgetData
}

export async function updateOfflineBudget(data: Omit<OfflineBudgetData, 'spent'>, payload: Record<string, unknown>) {
  const record = await getOfflineBudget(data.id)
  const updated = await updateLocalRecord({
    entityType: 'BUDGET', localId: data.id, data: { ...data, spent: record.data.spent }, payload,
  })
  return updated.data as OfflineBudgetData
}

export async function deleteOfflineBudget(id: string) {
  await getOfflineBudget(id)
  return deleteLocalRecord('BUDGET', id)
}

export function decimalMoney(value: number | string | null | undefined) {
  try {
    return new Decimal(value ?? 0)
  } catch {
    return new Decimal(0)
  }
}

export function toMoneyString(value: number | string) {
  return new Decimal(value).toFixed(2)
}
