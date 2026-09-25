export type OfflineEntityType = 'CATEGORY' | 'TRANSACTION' | 'BUDGET'
export type OfflineAction = 'CREATE' | 'UPDATE' | 'DELETE'

export interface OfflineCategoryData {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  iconKey: string
  color: string
  description?: string | null
  active: boolean
  transactionCount: number
}

export interface OfflineTransactionData {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: string
  categoryId: string
  categoryName: string
  categoryIconKey: string
  categoryColor: string
  transactionDate: string
  title: string
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface OfflineBudgetData {
  id: string
  month: string
  categoryId: string
  categoryName: string
  categoryIconKey: string
  categoryColor: string
  limitAmount: string
  spent: string
}

export interface OfflineRecord<T> {
  userId: string
  id: string
  serverId: string | null
  version: number
  data: T
  deleted: boolean
}

export interface OfflineOperation {
  userId: string
  operationId: string
  entityType: OfflineEntityType
  action: OfflineAction
  localId: string
  entityId: string | null
  baseVersion: number | null
  payload: Record<string, unknown> | null
  createdAt: number
  status?: 'PENDING' | 'CONFLICT'
  conflictCurrent?: OfflineOperationResult['current']
}

export interface OfflineSession {
  userId: string
  user: {
    id: number
    fullName: string
    email: string
    currency: string
  }
}

export interface OfflineMeta {
  userId: string
  hasSnapshot: boolean
  lastSyncedAt: string | null
  snapshotGeneratedAt: string | null
  lastError: string | null
}

export interface OfflineAlias {
  userId: string
  localId: string
  serverId: string
}

export interface OfflineSnapshotDto {
  generatedAt: string
  user: Omit<OfflineSession['user'], 'id'> & { id: string }
  categories: Array<OfflineCategoryData & { version: number }>
  transactions: Array<OfflineTransactionData & { version: number }>
  budgets: Array<OfflineBudgetData & { version: number }>
}

export interface OfflineOperationResult {
  operationId: string
  entityType: OfflineEntityType
  localId: string | null
  entityId: string | null
  version: number | null
  status: 'APPLIED' | 'CONFLICT'
  current: OfflineSnapshotDto['categories'][number]
    | OfflineSnapshotDto['transactions'][number]
    | OfflineSnapshotDto['budgets'][number]
    | null
}
