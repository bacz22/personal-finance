import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  OfflineAlias,
  OfflineBudgetData,
  OfflineCategoryData,
  OfflineMeta,
  OfflineOperation,
  OfflineRecord,
  OfflineSession,
  OfflineTransactionData,
} from './types'

interface FinanceOfflineDB extends DBSchema {
  sessions: {
    key: string
    value: OfflineSession
  }
  categories: {
    key: [string, string]
    value: OfflineRecord<OfflineCategoryData>
    indexes: { 'by-user': string }
  }
  transactions: {
    key: [string, string]
    value: OfflineRecord<OfflineTransactionData>
    indexes: { 'by-user': string }
  }
  budgets: {
    key: [string, string]
    value: OfflineRecord<OfflineBudgetData>
    indexes: { 'by-user': string }
  }
  operations: {
    key: [string, string]
    value: OfflineOperation
    indexes: { 'by-user': string }
  }
  aliases: {
    key: [string, string]
    value: OfflineAlias
    indexes: { 'by-user': string }
  }
  metadata: {
    key: string
    value: OfflineMeta
  }
}

const DATABASE_NAME = 'personal-finance-offline'
const DATABASE_VERSION = 1

let databasePromise: Promise<IDBPDatabase<FinanceOfflineDB>> | null = null

export function openOfflineDatabase() {
  if (!databasePromise) {
    databasePromise = openDB<FinanceOfflineDB>(DATABASE_NAME, DATABASE_VERSION, {
      upgrade(database, oldVersion) {
        if (oldVersion < 1) {
          database.createObjectStore('sessions', { keyPath: 'userId' })
          for (const name of ['categories', 'transactions', 'budgets', 'operations', 'aliases'] as const) {
            const store = database.createObjectStore(name, { keyPath: ['userId', name === 'operations' ? 'operationId' : name === 'aliases' ? 'localId' : 'id'] })
            store.createIndex('by-user', 'userId')
          }
          database.createObjectStore('metadata', { keyPath: 'userId' })
        }
      },
    })
  }
  return databasePromise
}

export const ACTIVE_USER_STORAGE_KEY = 'personalfinance.offline.active-user'

function readStoredUserId() {
  try {
    return window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY)
  } catch {
    return null
  }
}

let activeUserId = readStoredUserId()

export function getActiveUserId(): string | null {
  return activeUserId
}

export function setActiveUserId(userId: string | null) {
  activeUserId = userId
  try {
    if (userId) window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userId)
    else window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY)
  } catch {
    // IndexedDB remains the source of cached financial data if localStorage is unavailable.
  }
}

window.addEventListener('storage', (event) => {
  if (event.key !== ACTIVE_USER_STORAGE_KEY) return
  activeUserId = event.newValue
  window.dispatchEvent(new CustomEvent('offline-active-user-changed', { detail: activeUserId }))
})

export async function getUserRows<TStore extends 'categories' | 'transactions' | 'budgets'>(
  storeName: TStore,
  userId: string,
) {
  const database = await openOfflineDatabase()
  return (await database.getAll(storeName)).filter((row) => row.userId === userId)
}

export async function getUserOperations(userId: string) {
  const database = await openOfflineDatabase()
  return database.getAllFromIndex('operations', 'by-user', userId)
}

export async function deleteUserData(userId: string) {
  const database = await openOfflineDatabase()
  const transaction = database.transaction(
    ['sessions', 'categories', 'transactions', 'budgets', 'operations', 'aliases', 'metadata'],
    'readwrite',
  )
  const [categories, transactions, budgets, operations, aliases] = await Promise.all([
    transaction.objectStore('categories').index('by-user').getAllKeys(userId),
    transaction.objectStore('transactions').index('by-user').getAllKeys(userId),
    transaction.objectStore('budgets').index('by-user').getAllKeys(userId),
    transaction.objectStore('operations').index('by-user').getAllKeys(userId),
    transaction.objectStore('aliases').index('by-user').getAllKeys(userId),
  ])
  for (const key of categories) transaction.objectStore('categories').delete(key)
  for (const key of transactions) transaction.objectStore('transactions').delete(key)
  for (const key of budgets) transaction.objectStore('budgets').delete(key)
  for (const key of operations) transaction.objectStore('operations').delete(key)
  for (const key of aliases) transaction.objectStore('aliases').delete(key)
  transaction.objectStore('sessions').delete(userId)
  transaction.objectStore('metadata').delete(userId)
  await transaction.done
  if (getActiveUserId() === userId) setActiveUserId(null)
  announceDataChanged()
}

export function announceDataChanged() {
  window.dispatchEvent(new CustomEvent('offline-data-changed'))
}

export type OfflineDatabase = IDBPDatabase<FinanceOfflineDB>
