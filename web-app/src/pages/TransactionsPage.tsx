import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { Button, CurrencyText, DataLoadError, useToast } from '../components/ui'
import { categoriesApi, type CategoryItem } from '../components/categories'
import {
  TransactionFilterBar,
  TransactionTable,
  AddTransactionModal,
  EditTransactionModal,
  ViewTransactionModal,
  DeleteTransactionDialog,
  type TransactionFilters,
  type Transaction,
  DEFAULT_FILTERS,
} from '../components/transactions'
import {
  toTransactionCategoryOptions,
  transactionsApi,
  type TransactionDraft,
} from '../components/transactions/api'

const PAGE_SIZE = 10

function toDraft(transaction: Transaction): TransactionDraft {
  return {
    type: transaction.type,
    amount: transaction.amount,
    categoryId: transaction.categoryId,
    transactionDate: transaction.date,
    title: transaction.title,
    note: transaction.note,
  }
}

export const TransactionsPage: React.FC = () => {
  const toast = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
  const [categoriesError, setCategoriesError] = useState('')
  const [isError, setIsError] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [categoryReloadKey, setCategoryReloadKey] = useState(0)

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)

  const requestSequence = useRef(0)
  const allCategoryOptions = useMemo(() => toTransactionCategoryOptions(categories), [categories])
  const activeCategoryOptions = useMemo(
    () => allCategoryOptions.filter((category) => category.active),
    [allCategoryOptions],
  )
  const requestFilters = useMemo(
    () => ({
      search: debouncedSearch,
      type: filters.type,
      categoryId: filters.categoryId,
      datePreset: filters.datePreset,
      startDate: filters.startDate,
      endDate: filters.endDate,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount,
    }),
    [
      filters.type,
      filters.categoryId,
      filters.datePreset,
      filters.startDate,
      filters.endDate,
      filters.minAmount,
      filters.maxAmount,
      debouncedSearch,
    ],
  )

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.search), 300)
    return () => window.clearTimeout(timer)
  }, [filters.search])

  useEffect(() => {
    let isCurrent = true
    categoriesApi.list()
      .then((result) => {
        if (isCurrent) setCategories(result)
      })
      .catch((error: unknown) => {
        if (!isCurrent) return
        setCategoriesError(error instanceof Error ? error.message : 'Không thể tải danh mục giao dịch.')
      })
      .finally(() => {
        if (isCurrent) setIsCategoriesLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [categoryReloadKey])

  useEffect(() => {
    let isCurrent = true
    const sequence = ++requestSequence.current

    transactionsApi.list(requestFilters, currentPage, PAGE_SIZE)
      .then((result) => {
        if (!isCurrent || sequence !== requestSequence.current) return
        setTransactions(result.items)
        setTotalItems(result.totalItems)
        setTotals(result.totals)
        if (result.totalPages > 0 && currentPage > result.totalPages) {
          setIsLoading(true)
          setCurrentPage(result.totalPages)
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent || sequence !== requestSequence.current) return
        setIsError(true)
        setLoadError(error instanceof Error ? error.message : 'Không thể tải danh sách giao dịch.')
      })
      .finally(() => {
        if (isCurrent && sequence === requestSequence.current) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [
    requestFilters,
    currentPage,
    reloadKey,
  ])

  const handleFilterChange = (newFilters: TransactionFilters) => {
    setIsLoading(true)
    setIsError(false)
    setLoadError('')
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setIsLoading(true)
    setIsError(false)
    setLoadError('')
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  const handleRetry = () => {
    setIsLoading(true)
    setIsError(false)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  const handleCategoryRetry = () => {
    setIsCategoriesLoading(true)
    setCategoriesError('')
    setCategoryReloadKey((key) => key + 1)
  }

  const handlePageChange = (page: number) => {
    setIsLoading(true)
    setCurrentPage(page)
  }

  const handleView = (transaction: Transaction) => {
    setViewingTransaction(transaction)
    setIsViewModalOpen(true)
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsEditModalOpen(true)
  }

  const handleUpdateTransaction = async (transaction: Transaction) => {
    await transactionsApi.update(transaction.id, toDraft(transaction))
    toast.transactionUpdated(transaction.title)
    setIsLoading(true)
    setIsCategoriesLoading(true)
    setReloadKey((current) => current + 1)
    setCategoryReloadKey((current) => current + 1)
  }

  const handleAddTransaction = async (transaction: Transaction) => {
    await transactionsApi.create(toDraft(transaction))
    toast.transactionAdded(transaction.title)
    setIsLoading(true)
    setIsCategoriesLoading(true)
    setCurrentPage(1)
    setReloadKey((current) => current + 1)
    setCategoryReloadKey((current) => current + 1)
  }

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async (transaction: Transaction) => {
    await transactionsApi.delete(transaction.id)
    toast.transactionDeleted(transaction.title)
    setIsLoading(true)
    setIsCategoriesLoading(true)
    setReloadKey((current) => current + 1)
    setCategoryReloadKey((current) => current + 1)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 border-b border-white/60 pb-4 dark:border-slate-800/80 sm:flex-row sm:items-center sm:justify-between sm:pb-5">
        <div>
          <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl lg:text-3xl">
            Giao dịch
          </h1>
          <p className="mt-1 max-w-xl text-xs leading-normal text-slate-500 dark:text-slate-400 sm:text-sm">
            Quản lý, tra cứu và theo dõi chi tiết toàn bộ lịch sử thu chi cá nhân của bạn.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          className="w-full cursor-pointer justify-center rounded-2xl shadow-md shadow-emerald-600/25 sm:w-auto"
          disabled={isCategoriesLoading}
          onClick={() => setIsAddModalOpen(true)}
        >
          Thêm giao dịch
        </Button>
      </div>

      {categoriesError && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200 sm:flex-row sm:items-center sm:justify-between">
          <span>Không tải được danh mục, nên chưa thể tạo giao dịch. {categoriesError}</span>
          <Button variant="secondary" size="sm" onClick={handleCategoryRetry}>
            Tải lại danh mục
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-white/80 bg-[var(--glass-surface,rgba(255,255,255,0.82))] p-4 shadow-xs dark:border-slate-700/60 dark:bg-slate-900/85">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Tổng thu theo bộ lọc
          </div>
          {isLoading ? <span className="text-sm text-slate-400">Đang tính...</span> : isError ? <span className="text-sm text-rose-500">Không tải được</span> : (
            <CurrencyText amount={totals.income} type="income" size="lg" className="dark:!text-emerald-300" />
          )}
        </div>
        <div className="rounded-2xl border border-white/80 bg-[var(--glass-surface,rgba(255,255,255,0.82))] p-4 shadow-xs dark:border-slate-700/60 dark:bg-slate-900/85">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <TrendingDown className="h-4 w-4 text-rose-600 dark:text-rose-400" /> Tổng chi theo bộ lọc
          </div>
          {isLoading ? <span className="text-sm text-slate-400">Đang tính...</span> : isError ? <span className="text-sm text-rose-500">Không tải được</span> : (
            <CurrencyText amount={totals.expense} type="expense" size="lg" className="dark:!text-rose-300" />
          )}
        </div>
        <div className="rounded-2xl border border-white/80 bg-[var(--glass-surface,rgba(255,255,255,0.82))] p-4 shadow-xs dark:border-slate-700/60 dark:bg-slate-900/85">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" /> Chênh lệch thu chi
          </div>
          {isLoading ? <span className="text-sm text-slate-400">Đang tính...</span> : isError ? <span className="text-sm text-rose-500">Không tải được</span> : (
            <CurrencyText amount={totals.balance} type="balance" size="lg" className="dark:!text-blue-300" />
          )}
        </div>
      </div>

      <div className="space-y-4">
        <TransactionFilterBar
          filters={filters}
          categoryOptions={allCategoryOptions}
          onFilterChange={handleFilterChange}
          onResetFilters={handleResetFilters}
          className="relative z-20"
        />

        <div className="relative z-10">
          {isError ? (
            <DataLoadError
              title="Không thể tải danh sách giao dịch"
              message={loadError || 'Vui lòng kiểm tra kết nối rồi thử lại.'}
              onRetry={handleRetry}
              isRetrying={isLoading}
            />
          ) : (
            <TransactionTable
              isLoading={isLoading}
              transactions={transactions}
              filters={filters}
              onResetFilters={handleResetFilters}
              onAddTransaction={() => setIsAddModalOpen(true)}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              page={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={totalItems}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        categoryOptions={activeCategoryOptions}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddTransaction}
      />

      <EditTransactionModal
        isOpen={isEditModalOpen}
        categoryOptions={allCategoryOptions}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingTransaction(null)
        }}
        transaction={editingTransaction}
        onSuccess={handleUpdateTransaction}
      />

      <ViewTransactionModal
        isOpen={isViewModalOpen}
        categoryOptions={allCategoryOptions}
        onClose={() => {
          setIsViewModalOpen(false)
          setViewingTransaction(null)
        }}
        transaction={viewingTransaction}
        onEdit={(transaction) => {
          setIsViewModalOpen(false)
          setViewingTransaction(null)
          handleEdit(transaction)
        }}
      />

      <DeleteTransactionDialog
        isOpen={isDeleteDialogOpen}
        transaction={deletingTransaction}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingTransaction(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
