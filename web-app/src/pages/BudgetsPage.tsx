import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { Button, DatePicker, BudgetCardSkeleton, DataLoadError, useToast } from '../components/ui'
import {
  BudgetCard,
  BudgetOverviewCard,
  EmptyBudgetState,
  CreateBudgetModal,
  DeleteBudgetDialog,
  budgetsApi,
  calculateBudgetStats,
  type BudgetDraft,
  type BudgetStatus,
  type BudgetItem,
  type ExpenseCategoryOption,
} from '../components/budget'
import { categoriesApi, type CategoryItem } from '../components/categories'

export const BudgetsPage: React.FC = () => {
  const toast = useToast()
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear())
  const [statusFilter, setStatusFilter] = useState<BudgetStatus | 'all'>('all')
  const [budgets, setBudgets] = useState<BudgetItem[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loadedMonthKey, setLoadedMonthKey] = useState<string | null>(null)
  const [errorMonthKey, setErrorMonthKey] = useState<string | null>(null)
  const requestSequence = useRef(0)

  const loadMonthData = useCallback(async (month: number, year: number) => {
    const requestId = ++requestSequence.current
    try {
      const [nextBudgets, nextCategories] = await Promise.all([
        budgetsApi.list(month, year),
        categoriesApi.list(),
      ])
      if (requestId !== requestSequence.current) return
      setBudgets(nextBudgets)
      setCategories(nextCategories)
      setLoadedMonthKey(`${year}-${String(month).padStart(2, '0')}`)
      setErrorMonthKey(null)
    } catch {
      if (requestId === requestSequence.current) {
        setErrorMonthKey(`${year}-${String(month).padStart(2, '0')}`)
      }
    }
  }, [])

  useEffect(() => {
    let active = true
    void Promise.resolve().then(() => {
      if (active) void loadMonthData(currentMonth, currentYear)
    })
    return () => {
      active = false
      requestSequence.current += 1
    }
  }, [currentMonth, currentYear, loadMonthData])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetItem | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletingBudget, setDeletingBudget] = useState<BudgetItem | null>(null)

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const isLoading = loadedMonthKey !== monthKey && errorMonthKey !== monthKey
  const isError = errorMonthKey === monthKey
  const monthBudgets = budgets.filter((budget) =>
    budget.year === currentYear && budget.month === currentMonth,
  )
  const categoryOptions = useMemo<ExpenseCategoryOption[]>(() => categories
    .filter((category) => category.type === 'expense'
      && (category.status === 'active' || category.id === editingBudget?.categoryId))
    .map((category) => ({
      value: category.id,
      label: category.status === 'active' ? category.name : `${category.name} (ngừng sử dụng)`,
      icon: category.icon,
      color: category.color,
    })), [categories, editingBudget?.categoryId])

  const handleSaveBudget = async (draft: BudgetDraft) => {
    const saved = editingBudget
      ? await budgetsApi.update(editingBudget.id, draft)
      : await budgetsApi.create(draft)

    setStatusFilter('all')
    const [savedYear, savedMonth] = draft.month.split('-').map(Number)
    if (savedYear === currentYear && savedMonth === currentMonth) {
      setBudgets((current) => [
        ...current.filter((budget) => budget.id !== saved.id
          && !(budget.categoryId === saved.categoryId
            && budget.month === saved.month
            && budget.year === saved.year)),
        saved,
      ])
    } else {
      setErrorMonthKey(null)
      setCurrentYear(savedYear)
      setCurrentMonth(savedMonth)
    }
    toast.success(editingBudget ? 'Đã cập nhật ngân sách.' : 'Đã thiết lập ngân sách.')
  }

  const handleDeleteBudget = (budget: BudgetItem) => {
    setDeletingBudget(budget)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async (budgetToDelete: BudgetItem) => {
    await budgetsApi.delete(budgetToDelete.id)
    setBudgets((current) => current.filter((budget) => budget.id !== budgetToDelete.id))
    toast.success('Đã xóa ngân sách.')
  }

  const filteredBudgets = monthBudgets.filter((budget) =>
    statusFilter === 'all' || calculateBudgetStats(budget).status === statusFilter,
  )
  const allCalculated = monthBudgets.map(calculateBudgetStats)
  const safeCount = allCalculated.filter((budget) => budget.status === 'safe').length
  const warningCount = allCalculated.filter((budget) => budget.status === 'warning').length
  const exceededCount = allCalculated.filter((budget) => budget.status === 'exceeded').length

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Ngân sách tháng
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-normal">
            Thiết lập và giám sát giới hạn chi tiêu theo từng danh mục trong tháng để đạt mục tiêu tài chính.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-initial">
            <DatePicker
              mode="month"
              variant="stepper"
              month={currentMonth}
              year={currentYear}
              className="w-full sm:w-auto justify-between sm:justify-center"
              onMonthChange={(month, year) => {
                setCurrentMonth(month)
                setCurrentYear(year)
                setErrorMonthKey(null)
                setStatusFilter('all')
              }}
            />
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0 shadow-sm shadow-emerald-600/20 cursor-pointer text-xs sm:text-sm px-3.5 sm:px-4 py-2"
            onClick={() => {
              setEditingBudget(null)
              setIsCreateModalOpen(true)
            }}
          >
            <span className="hidden sm:inline">Thiết lập ngân sách</span>
            <span className="sm:hidden">Thêm mới</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <BudgetOverviewCard isLoading budgets={[]} month={currentMonth} year={currentYear} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => <BudgetCardSkeleton key={index} />)}
          </div>
        </div>
      ) : isError ? (
        <DataLoadError
          title="Không thể tải ngân sách"
          message="Hãy kiểm tra kết nối rồi thử tải lại ngân sách và danh mục chi tiêu."
          onRetry={() => {
            setErrorMonthKey(null)
            void loadMonthData(currentMonth, currentYear)
          }}
          retryText="Thử lại"
        />
      ) : monthBudgets.length === 0 ? (
        <EmptyBudgetState
          month={currentMonth}
          year={currentYear}
          onAddBudget={() => {
            setEditingBudget(null)
            setIsCreateModalOpen(true)
          }}
        />
      ) : (
        <div className="space-y-6">
          <BudgetOverviewCard budgets={monthBudgets} month={currentMonth} year={currentYear} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Hạn mức theo danh mục ({monthBudgets.length})
              </h2>
            </div>

            <div
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 w-full sm:w-auto pr-3 sm:pr-0 sm:flex-wrap"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                aria-pressed={statusFilter === 'all'}
                className={`whitespace-nowrap shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${statusFilter === 'all' ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs' : 'bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}`}
              >
                Tất cả ({monthBudgets.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('safe')}
                aria-pressed={statusFilter === 'safe'}
                className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${statusFilter === 'safe' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white/80 dark:bg-slate-800 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>An toàn ({safeCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('warning')}
                aria-pressed={statusFilter === 'warning'}
                className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${statusFilter === 'warning' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white/80 dark:bg-slate-800 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Cần chú ý ({warningCount})</span>
              </button>
              {exceededCount > 0 && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('exceeded')}
                  aria-pressed={statusFilter === 'exceeded'}
                  className={`whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer select-none active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${statusFilter === 'exceeded' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white/80 dark:bg-slate-800 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'}`}
                >
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Vượt hạn mức ({exceededCount})</span>
                </button>
              )}
              <span className="shrink-0 w-3 h-1 sm:hidden pointer-events-none" aria-hidden="true" />
            </div>
          </div>

          {filteredBudgets.length === 0 ? (
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-600 dark:text-slate-300 text-sm">
              Không có danh mục nào thuộc nhóm trạng thái này trong tháng đang chọn.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBudgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onClick={(selected) => {
                    setEditingBudget(selected)
                    setIsCreateModalOpen(true)
                  }}
                  onDelete={handleDeleteBudget}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CreateBudgetModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setEditingBudget(null)
        }}
        onSuccess={handleSaveBudget}
        onDelete={handleDeleteBudget}
        initialMonth={currentMonth}
        initialYear={currentYear}
        existingBudgets={monthBudgets}
        initialBudget={editingBudget}
        categoryOptions={categoryOptions}
      />

      <DeleteBudgetDialog
        isOpen={isDeleteDialogOpen}
        budget={deletingBudget}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          setDeletingBudget(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
