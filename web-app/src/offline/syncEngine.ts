import type { UserSummary } from '../api'
import { ApiError, apiRequest, getAccessToken } from '../api'
import {
  announceDataChanged,
  deleteUserData,
  getActiveUserId,
  getUserOperations,
  openOfflineDatabase,
  setActiveUserId,
} from './database'
import type {
  OfflineAction,
  OfflineBudgetData,
  OfflineCategoryData,
  OfflineEntityType,
  OfflineMeta,
  OfflineOperation,
  OfflineOperationResult,
  OfflineRecord,
  OfflineSession,
  OfflineSnapshotDto,
  OfflineTransactionData,
} from './types'

export interface SyncState {
  online: boolean
  syncing: boolean
  pendingCount: number
  lastSyncedAt: string | null
  lastError: string | null
  authRequired: boolean
  conflict: OfflineOperation | null
}

const listeners = new Set<() => void>()
const inFlightOperations = new Set<string>()
let syncPromise: Promise<void> | null = null
let syncRequested = false
let snapshotPromise: Promise<void> | null = null
let state: SyncState = {
  online: typeof navigator === 'undefined' ? false : navigator.onLine,
  syncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  lastError: null,
  authRequired: false,
  conflict: null,
}

function publish(next: Partial<SyncState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
  window.dispatchEvent(new CustomEvent('offline-sync-state-changed'))
}

export function getSyncState() {
  return state
}

export function subscribeSyncState(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

async function refreshPendingState() {
  const userId = getActiveUserId()
  if (!userId) {
    publish({ pendingCount: 0, conflict: null, lastSyncedAt: null })
    return
  }
  const [operations, database] = await Promise.all([getUserOperations(userId), openOfflineDatabase()])
  const meta = await database.get('metadata', userId)
  const conflict = operations.find((operation) => operation.status === 'CONFLICT') ?? null
  publish({
    pendingCount: operations.length,
    conflict,
    lastSyncedAt: meta?.lastSyncedAt ?? null,
    lastError: meta?.lastError ?? state.lastError,
  })
}

async function setMeta(userId: string, patch: Partial<OfflineMeta>) {
  const database = await openOfflineDatabase()
  const current = await database.get('metadata', userId)
  await database.put('metadata', {
    userId,
    hasSnapshot: false,
    lastSyncedAt: null,
    snapshotGeneratedAt: null,
    lastError: null,
    ...current,
    ...patch,
  })
}

export async function activateUser(user: UserSummary) {
  const userId = String(user.id)
  const database = await openOfflineDatabase()
  const session: OfflineSession = { userId, user }
  await database.put('sessions', session)
  setActiveUserId(userId)
  publish({ authRequired: false, lastError: null })
  await refreshPendingState()
  void syncNow()
}

export async function restoreCachedUser(): Promise<UserSummary | null> {
  const database = await openOfflineDatabase()
  const userId = getActiveUserId()
  if (!userId) return null
  const session = await database.get('sessions', userId)
  if (!session) return null
  setActiveUserId(userId)
  await refreshPendingState()
  return session.user
}

export async function pendingOperationCount() {
  const userId = getActiveUserId()
  if (!userId) return 0
  return (await getUserOperations(userId)).length
}

export function isOperationInFlight(operationId: string) {
  return inFlightOperations.has(operationId)
}

export async function ensureSnapshot() {
  const userId = getActiveUserId()
  if (!userId) throw new Error('Chưa có tài khoản đang hoạt động.')
  const database = await openOfflineDatabase()
  const meta = await database.get('metadata', userId)
  if (meta?.hasSnapshot) return
  if (snapshotPromise) return snapshotPromise
  if (!navigator.onLine) throw new Error('Chưa có dữ liệu đã tải trên thiết bị. Hãy kết nối mạng một lần để chuẩn bị dùng offline.')
  snapshotPromise = pullSnapshot(userId).finally(() => { snapshotPromise = null })
  return snapshotPromise
}

export function syncNow() {
  if (syncPromise) {
    syncRequested = true
    return syncPromise
  }
  syncPromise = (async () => {
    do {
      syncRequested = false
      await runSync()
    } while (syncRequested)
  })().finally(() => { syncPromise = null })
  return syncPromise
}

async function runSync() {
  const userId = getActiveUserId()
  const online = navigator.onLine
  publish({ online, authRequired: false })
  if (!userId || !online || !getAccessToken()) {
    await refreshPendingState()
    return
  }

  publish({ syncing: true, lastError: null })
  try {
    const database = await openOfflineDatabase()
    const meta = await database.get('metadata', userId)
    if (!meta?.hasSnapshot) await pullSnapshot(userId)

    const operations = (await getUserOperations(userId)).sort((a, b) =>
      a.createdAt - b.createdAt
      || (a.entityType === 'CATEGORY' ? -1 : b.entityType === 'CATEGORY' ? 1 : 0),
    )
    for (const queued of operations) {
      // An earlier CREATE may have filled in this operation's server id and base version.
      const operation = await database.get('operations', [userId, queued.operationId])
      if (!operation) continue
      if (operation.status === 'CONFLICT') {
        publish({ conflict: operation, lastError: 'Có thay đổi trên thiết bị khác cần bạn xử lý.' })
        return
      }
      inFlightOperations.add(operation.operationId)
      try {
        const payload = await resolveOperationPayload(operation)
        let result: OfflineOperationResult
        try {
          result = await apiRequest<OfflineOperationResult>('/api/v1/offline/operations', {
            method: 'POST',
            body: JSON.stringify({
              operationId: operation.operationId,
              entityType: operation.entityType,
              action: operation.action,
              localId: operation.localId,
              entityId: operation.entityId,
              baseVersion: operation.baseVersion,
              payload,
            }),
          })
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 409 || error.errorCode !== 'SYNC_VERSION_CONFLICT') {
            throw error
          }
          const latest = await apiRequest<OfflineSnapshotDto>('/api/v1/offline/snapshot')
          const rows = operation.entityType === 'CATEGORY'
            ? latest.categories
            : operation.entityType === 'TRANSACTION' ? latest.transactions : latest.budgets
          const current = rows.find((row) => row.id === operation.entityId) ?? null
          result = {
            operationId: operation.operationId,
            entityType: operation.entityType,
            localId: operation.localId,
            entityId: operation.entityId,
            version: current?.version ?? null,
            status: 'CONFLICT',
            current,
          }
        }
        if (result.status === 'CONFLICT') {
          const conflicted = { ...operation, status: 'CONFLICT' as const, conflictCurrent: result.current }
          await database.put('operations', conflicted)
          publish({ conflict: conflicted, lastError: 'Có thay đổi trên thiết bị khác cần bạn xử lý.' })
          return
        }
        await applyAcknowledgement(operation, result)
      } finally {
        inFlightOperations.delete(operation.operationId)
      }
    }

    await pullSnapshot(userId)
    await setMeta(userId, { lastError: null })
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && error.errorCode === 'SESSION_CHANGED') {
      publish({ authRequired: false, lastError: null })
    } else if (error instanceof ApiError && error.status === 401) {
      publish({ authRequired: true, lastError: 'Phiên đăng nhập đã hết hạn. Đăng nhập lại để đồng bộ.' })
      window.dispatchEvent(new CustomEvent('offline-auth-required'))
    } else {
      const message = error instanceof Error ? error.message : 'Không thể đồng bộ dữ liệu.'
      await setMeta(userId, { lastError: message })
      publish({ lastError: message })
    }
  } finally {
    publish({ syncing: false, online: navigator.onLine })
    await refreshPendingState()
  }
}

async function resolveOperationPayload(operation: OfflineOperation) {
  if (!operation.payload) return null
  if (operation.entityType !== 'TRANSACTION' && operation.entityType !== 'BUDGET') return operation.payload
  const categoryId = operation.payload.categoryId
  if (typeof categoryId !== 'string' || !categoryId.startsWith('local:')) return operation.payload
  const record = await findRecord('categories', operation.userId, categoryId)
  if (!record?.serverId) throw new Error('Đang chờ đồng bộ danh mục được giao dịch hoặc ngân sách sử dụng.')
  return { ...operation.payload, categoryId: record.serverId }
}

async function findRecord<TStore extends 'categories' | 'transactions' | 'budgets'>(
  storeName: TStore,
  userId: string,
  id: string,
) {
  const database = await openOfflineDatabase()
  return database.get(storeName, [userId, id])
}

async function applyAcknowledgement(operation: OfflineOperation, result: OfflineOperationResult) {
  const database = await openOfflineDatabase()
  const storeName = storeFor(operation.entityType)
  const transaction = database.transaction([storeName, 'operations', 'aliases'], 'readwrite')
  const store = transaction.objectStore(storeName)
  const record = await store.get([operation.userId, operation.localId]) as OfflineRecord<unknown> | undefined
  await transaction.objectStore('operations').delete([operation.userId, operation.operationId])

  if (operation.action === 'DELETE') {
    if (operation.entityType === 'CATEGORY' && record) {
      const category = record.data as OfflineCategoryData
      await store.put({
        ...record,
        serverId: result.entityId ?? record.serverId,
        version: Math.max(record.version, result.version ?? record.version),
        deleted: false,
        data: { ...category, active: false },
      } as never)
    } else if (record) {
      await store.delete([operation.userId, operation.localId])
    }
  } else if (record) {
    const serverId = result.entityId ?? record.serverId
    await store.put({
      ...record,
      serverId,
      version: Math.max(record.version, result.version ?? record.version),
      deleted: false,
    } as never)
    if (operation.localId.startsWith('local:') && serverId) {
      await transaction.objectStore('aliases').put({
        userId: operation.userId,
        localId: operation.localId,
        serverId,
      })
    }
    const operations = await transaction.objectStore('operations').index('by-user').getAll(operation.userId)
    for (const queued of operations) {
      if (queued.localId === operation.localId && !queued.entityId && serverId) {
        queued.entityId = serverId
        if (queued.baseVersion === null) queued.baseVersion = result.version
        await transaction.objectStore('operations').put(queued)
      }
    }
  }

  await transaction.done
  announceDataChanged()
  await refreshPendingState()
}

function storeFor(entityType: OfflineEntityType): 'categories' | 'transactions' | 'budgets' {
  if (entityType === 'CATEGORY') return 'categories'
  if (entityType === 'TRANSACTION') return 'transactions'
  return 'budgets'
}

async function pullSnapshot(userId: string) {
  const snapshot = await apiRequest<OfflineSnapshotDto>('/api/v1/offline/snapshot')
  await applySnapshot(userId, snapshot)
  const syncedAt = new Date().toISOString()
  await setMeta(userId, {
    hasSnapshot: true,
    lastSyncedAt: syncedAt,
    snapshotGeneratedAt: snapshot.generatedAt,
    lastError: null,
  })
  publish({ lastSyncedAt: syncedAt, lastError: null })
}

async function applySnapshot(userId: string, snapshot: OfflineSnapshotDto) {
  const database = await openOfflineDatabase()
  const transaction = database.transaction(
    ['categories', 'transactions', 'budgets', 'operations', 'sessions'],
    'readwrite',
  )
  const categoriesStore = transaction.objectStore('categories')
  const transactionsStore = transaction.objectStore('transactions')
  const budgetsStore = transaction.objectStore('budgets')
  const [oldCategories, oldTransactions, oldBudgets, operations] = await Promise.all([
    categoriesStore.index('by-user').getAll(userId),
    transactionsStore.index('by-user').getAll(userId),
    budgetsStore.index('by-user').getAll(userId),
    transaction.objectStore('operations').index('by-user').getAll(userId),
  ])
  const dirtyIds = new Set(operations.map((operation) => `${operation.entityType}:${operation.localId}`))
  const categoryIdentityByServerId = new Map<string, string>()
  for (const category of snapshot.categories) {
    const existing = oldCategories.find((row) => row.serverId === category.id)
    categoryIdentityByServerId.set(category.id, existing?.id ?? category.id)
  }

  const categoryServerIds = new Set(snapshot.categories.map((row) => row.id))
  for (const row of oldCategories) {
    if (!dirtyIds.has(`CATEGORY:${row.id}`) && row.serverId && !categoryServerIds.has(row.serverId)) {
      await categoriesStore.delete([userId, row.id])
    }
  }
  for (const wire of snapshot.categories) {
    const existing = oldCategories.find((row) => row.serverId === wire.id)
    if (existing && dirtyIds.has(`CATEGORY:${existing.id}`)) continue
    const localId = existing?.id ?? wire.id
    await categoriesStore.put({
      userId, id: localId, serverId: wire.id, version: wire.version,
      data: { ...wire, id: localId }, deleted: false,
    })
  }

  const transactionServerIds = new Set(snapshot.transactions.map((row) => row.id))
  for (const row of oldTransactions) {
    if (!dirtyIds.has(`TRANSACTION:${row.id}`) && row.serverId && !transactionServerIds.has(row.serverId)) {
      await transactionsStore.delete([userId, row.id])
    }
  }
  for (const wire of snapshot.transactions) {
    const existing = oldTransactions.find((row) => row.serverId === wire.id)
    if (existing && dirtyIds.has(`TRANSACTION:${existing.id}`)) continue
    const localId = existing?.id ?? wire.id
    await transactionsStore.put({
      userId, id: localId, serverId: wire.id, version: wire.version,
      data: { ...wire, id: localId, categoryId: categoryIdentityByServerId.get(wire.categoryId) ?? wire.categoryId },
      deleted: false,
    })
  }

  const budgetServerIds = new Set(snapshot.budgets.map((row) => row.id))
  for (const row of oldBudgets) {
    if (!dirtyIds.has(`BUDGET:${row.id}`) && row.serverId && !budgetServerIds.has(row.serverId)) {
      await budgetsStore.delete([userId, row.id])
    }
  }
  for (const wire of snapshot.budgets) {
    const existing = oldBudgets.find((row) => row.serverId === wire.id)
    if (existing && dirtyIds.has(`BUDGET:${existing.id}`)) continue
    const localId = existing?.id ?? wire.id
    await budgetsStore.put({
      userId, id: localId, serverId: wire.id, version: wire.version,
      data: { ...wire, id: localId, categoryId: categoryIdentityByServerId.get(wire.categoryId) ?? wire.categoryId },
      deleted: false,
    })
  }

  transaction.objectStore('sessions').put({ userId, user: { ...snapshot.user, id: Number(snapshot.user.id) } })
  await transaction.done
  announceDataChanged()
}

export async function enqueueLocalChange<T>(args: {
  entityType: OfflineEntityType
  action: OfflineAction
  localId: string
  serverId: string | null
  baseVersion: number | null
  payload: T | null
}) {
  const userId = getActiveUserId()
  if (!userId) throw new Error('Chưa có tài khoản đang hoạt động.')
  const database = await openOfflineDatabase()
  const operations = await getUserOperations(userId)
  const operation = {
    userId,
    operationId: crypto.randomUUID(),
    entityType: args.entityType,
    action: args.action,
    localId: args.localId,
    entityId: args.serverId,
    baseVersion: args.baseVersion,
    payload: args.payload as Record<string, unknown> | null,
    createdAt: Date.now(),
    status: 'PENDING' as const,
  }
  const coalescible = [...operations].reverse().find((existing) =>
    existing.localId === args.localId
    && existing.entityType === args.entityType
    && existing.action !== 'CREATE'
    && existing.action !== 'DELETE'
    && existing.status !== 'CONFLICT'
    && !isOperationInFlight(existing.operationId),
  )
  if (coalescible && args.action === 'UPDATE') {
    coalescible.payload = operation.payload
    await database.put('operations', coalescible)
  } else {
    await database.put('operations', operation)
  }
  announceDataChanged()
  await refreshPendingState()
  void syncNow()
}

export async function createLocalRecord<T>(
  entityType: OfflineEntityType,
  setId: (id: string) => T,
  payload: Record<string, unknown>,
): Promise<OfflineRecord<T>> {
  const userId = getActiveUserId()
  if (!userId) throw new Error('Chưa có tài khoản đang hoạt động.')
  await ensureSnapshot()
  const localId = `local:${crypto.randomUUID()}`
  const record: OfflineRecord<T> = {
    userId,
    id: localId,
    serverId: null,
    version: 0,
    data: setId(localId),
    deleted: false,
  }
  const operationId = crypto.randomUUID()
  const database = await openOfflineDatabase()
  const storeName = storeFor(entityType)
  const transaction = database.transaction([storeName, 'operations'], 'readwrite')
  transaction.objectStore(storeName).put(record as never)
  transaction.objectStore('operations').put({
    userId,
    operationId,
    entityType,
    action: 'CREATE',
    localId,
    entityId: null,
    baseVersion: null,
    payload,
    createdAt: Date.now(),
    status: 'PENDING',
  })
  await transaction.done
  announceDataChanged()
  await refreshPendingState()
  void syncNow()
  return record
}

export async function updateLocalRecord<T>(args: {
  entityType: OfflineEntityType
  localId: string
  data: T
  payload: Record<string, unknown>
}) {
  const userId = getActiveUserId()
  if (!userId) throw new Error('Chưa có tài khoản đang hoạt động.')
  await ensureSnapshot()
  const database = await openOfflineDatabase()
  const storeName = storeFor(args.entityType)
  const transaction = database.transaction([storeName, 'operations'], 'readwrite')
  const recordStore = transaction.objectStore(storeName)
  const record = await recordStore.get([userId, args.localId]) as OfflineRecord<T> | undefined
  if (!record) {
    transaction.abort()
    throw new Error('Không tìm thấy dữ liệu trên thiết bị. Hãy đồng bộ lại rồi thử tiếp.')
  }
  const operationStore = transaction.objectStore('operations')
  const operations = await operationStore.index('by-user').getAll(userId)
  const own = operations.filter((operation) =>
    operation.entityType === args.entityType && operation.localId === args.localId,
  )
  const pendingCreate = [...own].reverse().find((operation) => operation.action === 'CREATE')
  const pendingUpdate = [...own].reverse().find((operation) =>
    operation.action === 'UPDATE' && operation.status !== 'CONFLICT'
      && !isOperationInFlight(operation.operationId),
  )
  let version = record.version
  if (pendingCreate && !isOperationInFlight(pendingCreate.operationId)) {
    pendingCreate.payload = args.payload
    await operationStore.put(pendingCreate)
  } else if (pendingUpdate) {
    pendingUpdate.payload = args.payload
    await operationStore.put(pendingUpdate)
  } else {
    await operationStore.put({
      userId,
      operationId: crypto.randomUUID(),
      entityType: args.entityType,
      action: 'UPDATE',
      localId: args.localId,
      entityId: record.serverId,
      baseVersion: record.version,
      payload: args.payload,
      createdAt: Date.now(),
      status: 'PENDING',
    } satisfies OfflineOperation)
    version += 1
  }
  const updated = { ...record, version, data: args.data, deleted: false }
  await recordStore.put(updated as never)
  await transaction.done
  announceDataChanged()
  await refreshPendingState()
  void syncNow()
  return updated
}

export async function deleteLocalRecord(entityType: OfflineEntityType, localId: string, updatedData?: unknown) {
  const userId = getActiveUserId()
  if (!userId) throw new Error('Chưa có tài khoản đang hoạt động.')
  await ensureSnapshot()
  const database = await openOfflineDatabase()
  const storeName = storeFor(entityType)
  const transaction = database.transaction([storeName, 'operations'], 'readwrite')
  const recordStore = transaction.objectStore(storeName)
  const operationStore = transaction.objectStore('operations')
  const record = await recordStore.get([userId, localId]) as OfflineRecord<unknown> | undefined
  if (!record) {
    transaction.abort()
    return
  }
  const operations = await operationStore.index('by-user').getAll(userId)
  const own = operations.filter((operation) =>
    operation.entityType === entityType && operation.localId === localId,
  )
  const pendingCreate = own.find((operation) => operation.action === 'CREATE')
  if (!record.serverId && pendingCreate && !isOperationInFlight(pendingCreate.operationId)) {
    for (const operation of own) await operationStore.delete([userId, operation.operationId])
    await recordStore.delete([userId, localId])
  } else {
    await operationStore.put({
      userId,
      operationId: crypto.randomUUID(),
      entityType,
      action: 'DELETE',
      localId,
      entityId: record.serverId,
      baseVersion: record.version,
      payload: null,
      createdAt: Date.now(),
      status: 'PENDING',
    } satisfies OfflineOperation)
    const categoryDeactivation = entityType === 'CATEGORY'
    await recordStore.put({
      ...record,
      deleted: !categoryDeactivation,
      data: updatedData ?? record.data,
    } as never)
  }
  await transaction.done
  announceDataChanged()
  await refreshPendingState()
  void syncNow()
}

export async function cancelLocalCreate(entityType: OfflineEntityType, localId: string) {
  const userId = getActiveUserId()
  if (!userId) return
  const database = await openOfflineDatabase()
  const storeName = storeFor(entityType)
  const transaction = database.transaction([storeName, 'operations'], 'readwrite')
  const operations = await transaction.objectStore('operations').index('by-user').getAll(userId)
  for (const operation of operations) {
    if (operation.localId === localId && operation.entityType === entityType && !isOperationInFlight(operation.operationId)) {
      await transaction.objectStore('operations').delete([userId, operation.operationId])
    }
  }
  await transaction.objectStore(storeName).delete([userId, localId])
  await transaction.done
  announceDataChanged()
  await refreshPendingState()
}

export async function resolveConflict(useLocal: boolean) {
  const userId = getActiveUserId()
  const conflict = state.conflict
  if (!userId || !conflict) return
  const database = await openOfflineDatabase()
  const current = conflict.conflictCurrent as OfflineOperationResult['current']
  const recordStoreName = storeFor(conflict.entityType)
  const transaction = database.transaction([recordStoreName, 'operations'], 'readwrite')
  const operations = await transaction.objectStore('operations').index('by-user').getAll(userId)
  const sameRecord = operations.filter((operation) =>
    operation.entityType === conflict.entityType && operation.localId === conflict.localId,
  )
  const record = await transaction.objectStore(recordStoreName).get([userId, conflict.localId]) as OfflineRecord<unknown> | undefined

  if (useLocal && record) {
    const latestLocalIntent = [...sameRecord].sort((a, b) => a.createdAt - b.createdAt).at(-1) ?? conflict
    for (const operation of sameRecord) {
      if (operation.operationId !== latestLocalIntent.operationId) {
        await transaction.objectStore('operations').delete([userId, operation.operationId])
      }
    }

    // The server copy is already gone; accepting the phone's delete is therefore complete.
    if (!current && latestLocalIntent.action === 'DELETE') {
      await transaction.objectStore('operations').delete([userId, latestLocalIntent.operationId])
      await transaction.objectStore(recordStoreName).delete([userId, conflict.localId])
    } else {
      const next = { ...latestLocalIntent, status: 'PENDING' as const, conflictCurrent: undefined }
      if (current && conflict.entityId) {
        next.entityId = conflict.entityId
        next.baseVersion = conflictVersion(current)
      } else if (!current) {
        // The web copy was deleted. Re-create the latest phone copy under a fresh idempotency key.
        await transaction.objectStore('operations').delete([userId, latestLocalIntent.operationId])
        next.action = 'CREATE'
        next.entityId = null
        next.baseVersion = null
        next.operationId = crypto.randomUUID()
      }
      await transaction.objectStore('operations').put(next)
      if (current) record.version = conflictVersion(current) ?? record.version
      await transaction.objectStore(recordStoreName).put(record as never)
    }
  } else {
    for (const operation of sameRecord) {
      await transaction.objectStore('operations').delete([userId, operation.operationId])
    }
    if (record && current) {
      const serverId = conflict.entityId ?? record.serverId
      const mapped = mapServerData(conflict.entityType, current, record.id)
      await transaction.objectStore(recordStoreName).put({
        ...record,
        data: mapped,
        serverId,
        version: conflictVersion(current) ?? record.version,
        deleted: false,
      } as never)
    } else if (record) {
      await transaction.objectStore(recordStoreName).delete([userId, conflict.localId])
    }
  }
  await transaction.done
  publish({ conflict: null, lastError: null })
  announceDataChanged()
  await refreshPendingState()
  void syncNow()
}

function conflictVersion(current: OfflineOperationResult['current']): number | null {
  return current?.version ?? null
}

function mapServerData(
  entityType: OfflineEntityType,
  current: OfflineOperationResult['current'],
  localId: string,
) {
  if (!current) return current
  if (entityType === 'CATEGORY') return { ...current, id: localId } as OfflineCategoryData
  if (entityType === 'TRANSACTION') return { ...current, id: localId } as OfflineTransactionData
  return { ...current, id: localId } as OfflineBudgetData
}

export async function forgetCurrentUser(discardPending: boolean) {
  const userId = getActiveUserId()
  if (!userId) return
  const operations = await getUserOperations(userId)
  if (operations.length > 0 && !discardPending) {
    await syncNow()
    const remaining = await getUserOperations(userId)
    if (remaining.length > 0) throw new Error(`${remaining.length} thay đổi chưa đồng bộ. Hãy đồng bộ hoặc xác nhận xóa dữ liệu chờ.`)
  }
  await deleteUserData(userId)
}

window.addEventListener('online', () => {
  publish({ online: true })
  void syncNow()
})
window.addEventListener('offline', () => publish({ online: false }))
window.addEventListener('focus', () => { if (navigator.onLine) void syncNow() })
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && navigator.onLine) void syncNow()
})
window.addEventListener('offline-data-changed', () => { void refreshPendingState() })
