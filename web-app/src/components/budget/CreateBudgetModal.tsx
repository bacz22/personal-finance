import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Plus,
  PiggyBank,
  AlertTriangle,
  AlertCircle,
  Trash2,
} from 'lucide-react'
import { DatePicker } from '../ui/DatePicker'
import { Select, type SelectOption } from '../ui/Select'
import { Button } from '../ui/Button'
import { CurrencyText } from '../ui/CurrencyText'
import { formatVND } from '@/utils/formatters'
import { getCategoryBadgeStyle } from '@/tokens'
import { MAX_UI_MONEY, formatMoneyDigits } from '../../money'
import {
  type BudgetDraft,
  type BudgetItem,
  type ExpenseCategoryOption,
} from './types'

const QUICK_BUDGET_AMOUNTS = [
  { label: '+500k', value: 500000 },
  { label: '+1Tr', value: 1000000 },
  { label: '+2Tr', value: 2000000 },
  { label: '+5Tr', value: 5000000 },
  { label: '+10Tr', value: 10000000 },
]

export interface CreateBudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (budget: BudgetDraft) => Promise<void> | void
  onDelete?: (budget: BudgetItem) => void
  initialMonth?: number
  initialYear?: number
  existingBudgets?: BudgetItem[]
  initialBudget?: BudgetItem | null
  categoryOptions?: ExpenseCategoryOption[]
}

interface CreateBudgetModalContentProps extends Omit<CreateBudgetModalProps, 'isOpen'> {}

const CreateBudgetModalContent: React.FC<CreateBudgetModalContentProps> = ({
  onClose,
  onSuccess,
  onDelete,
  initialMonth = new Date().getMonth() + 1,
  initialYear = new Date().getFullYear(),
  existingBudgets = [],
  initialBudget = null,
  categoryOptions = [],
}) => {
  const limitInputRef = useRef<HTMLInputElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)

  // Danh sách options danh mục chuẩn hóa cho Select component
  const categorySelectOptions: SelectOption[] = categoryOptions.map((cat) => {
    const CatIcon = cat.icon
    return {
      value: cat.value,
      label: cat.label,
      icon: (
        <span
          className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={getCategoryBadgeStyle(cat.color)}
        >
          <CatIcon className="w-3 h-3" />
        </span>
      ),
    }
  })

  // State Form
  const [selectedMonth, setSelectedMonth] = useState(initialBudget ? initialBudget.month : initialMonth)
  const [selectedYear, setSelectedYear] = useState(initialBudget ? initialBudget.year : initialYear)
  const [categoryId, setCategoryId] = useState<string>(initialBudget?.categoryId ?? '')
  const [limitStr, setLimitStr] = useState<string>(initialBudget ? String(initialBudget.budgetLimit) : '')

  // Validation & Submission
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Kiểm tra trùng lặp: Đã có ngân sách cho cùng tháng và category chưa
  const duplicateBudget = existingBudgets.find(
    (b) =>
      b.month === selectedMonth &&
      b.year === selectedYear &&
      b.categoryId === categoryId &&
      b.id !== initialBudget?.id
  )
  const selectedCategoryLabel = categoryOptions.find((category) => category.value === categoryId)?.label
    ?? initialBudget?.categoryName

  // Quản lý khóa cuộn trang và autofocus
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const timer = setTimeout(() => {
      limitInputRef.current?.focus()
    }, 80)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = 'unset'
      previousFocus?.focus()
    }
  }, [])

  // Phím Escape và Focus Trap cho Tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose()
        return
      }

      if (e.key === 'Tab' && modalContainerRef.current) {
        const focusableElements = modalContainerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSubmitting, onClose])

  // Format số tiền hiển thị
  const formattedDisplayLimit = limitStr ? formatMoneyDigits(limitStr) : ''

  const handleLimitChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '')
    setLimitStr(cleanDigits)
    if (errors.limit) {
      setErrors((prev) => ({ ...prev, limit: '' }))
    }
  }

  const handleQuickAdd = (addVal: number) => {
    const currentNum = Number(limitStr) || 0
    setLimitStr(String(currentNum + addVal))
    if (errors.limit) {
      setErrors((prev) => ({ ...prev, limit: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const numLimit = Number(limitStr)

    if (!limitStr || isNaN(numLimit) || numLimit <= 0) {
      newErrors.limit = 'Hạn mức ngân sách bắt buộc phải lớn hơn 0 ₫'
    } else if (numLimit > MAX_UI_MONEY) {
      newErrors.limit = `Hạn mức tối đa là ${MAX_UI_MONEY.toLocaleString('vi-VN')} ₫`
    }

    if (!categoryId || !categoryOptions.some((category) => category.value === categoryId)) {
      newErrors.category = 'Vui lòng chọn danh mục chi tiêu'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (duplicateBudget || !validateForm()) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await onSuccess({
        month: `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`,
        categoryId: Number(categoryId),
        limitAmount: Number(limitStr),
      })
      onClose()
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Không thể lưu ngân sách. Vui lòng thử lại.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />

      {/* Modal Dialog Box: Dạng Popup bo góc nổi giữa màn hình trên mọi thiết bị */}
      <div
        ref={modalContainerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-budget-modal-title"
        className="relative w-full max-w-md bg-white/80 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.12),0_4px_20px_rgba(0,0,0,0.04)] border border-white/80 dark:border-slate-700/60 z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200 my-auto"
      >
        {/* ========================================================================= */}
        {/* HEADER MODAL */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/60 dark:border-slate-800/60 flex items-center justify-between bg-white/40 dark:bg-slate-900/40 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-white/80">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="create-budget-modal-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
              >
                {initialBudget ? 'Cập nhật ngân sách' : 'Thêm mới ngân sách'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {initialBudget
                  ? `Điều chỉnh hạn mức chi tiêu cho danh mục ${selectedCategoryLabel ?? ''}`
                  : 'Đặt hạn mức chi tiêu cho từng danh mục trong tháng'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* BODY: FORM THIẾT LẬP */}
        {/* ========================================================================= */}
        <form
          id="create-budget-form"
          noValidate
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4"
        >
          {/* 1. THÁNG ÁP DỤNG */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Tháng áp dụng <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <DatePicker
                mode="month"
                variant="stepper"
                month={selectedMonth}
                year={selectedYear}
                onMonthChange={(m, y) => {
                  setSelectedMonth(m)
                  setSelectedYear(y)
                }}
              />
            </div>
          </div>

          {/* 2. DANH MỤC CHI TIÊU (CHỈ LẤY EXPENSE CATEGORY) */}
          <div className="space-y-1.5">
            <Select
              id="budget-category-select"
              label="Danh mục chi tiêu"
              required
              disabled={categorySelectOptions.length === 0}
              options={categorySelectOptions}
              value={categoryId}
              onChange={(val) => {
                setCategoryId(String(val))
                if (errors.category) setErrors((prev) => ({ ...prev, category: '' }))
              }}
              error={errors.category}
              placeholder={categorySelectOptions.length ? 'Chọn danh mục chi tiêu...' : 'Danh mục sẽ tải từ API'}
              helperText={categorySelectOptions.length === 0 ? 'Chưa có danh mục chi tiêu đang hoạt động.' : undefined}
            />
          </div>

          {/* CẢNH BÁO TRÙNG LẶP NẾU ĐÃ CÓ NGÂN SÁCH CÙNG THÁNG & DANH MỤC */}
          {duplicateBudget && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Đã tồn tại ngân sách cho danh mục này</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-200 leading-normal pl-5">
                Trong Tháng {String(selectedMonth).padStart(2, '0')}/{selectedYear}, danh mục{' '}
                <strong>{duplicateBudget.categoryName}</strong> đã có hạn mức là{' '}
                <strong>{formatVND(duplicateBudget.budgetLimit)}</strong> (đã chi tiêu:{' '}
                {formatVND(duplicateBudget.spent)}). Hãy mở ngân sách hiện có để chỉnh sửa thay vì tạo trùng.
              </p>
            </div>
          )}

          {submitError && (
            <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200">
              {submitError}
            </div>
          )}

          {/* 3. HẠN MỨC NGÂN SÁCH (HERO FIELD: LỚN HƠN 0, FORMAT VND) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="budget-limit-input"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200 block"
              >
                Hạn mức ngân sách tối đa <span className="text-rose-500">*</span>
              </label>
              {Number(limitStr) > 0 && Number(limitStr) <= MAX_UI_MONEY && (
                <CurrencyText
                  amount={Number(limitStr)}
                  type="income"
                  size="xs"
                  className="font-mono font-semibold"
                />
              )}
            </div>

            <div
              className={`relative flex items-center rounded-2xl border transition-all p-3.5 sm:p-4 shadow-2xs ${
                errors.limit
                  ? 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/20 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md focus-within:bg-white dark:focus-within:bg-slate-800'
                  : 'border-white/80 dark:border-slate-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md focus-within:bg-white dark:focus-within:bg-slate-800'
              }`}
            >
              <input
                ref={limitInputRef}
                id="budget-limit-input"
                type="text"
                inputMode="numeric"
                value={formattedDisplayLimit}
                onChange={(e) => handleLimitChange(e.target.value)}
                placeholder="0"
                aria-invalid={!!errors.limit}
                aria-describedby={errors.limit ? 'budget-limit-error' : undefined}
                className="w-full text-2xl sm:text-3xl font-extrabold font-mono tracking-tight bg-transparent focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              <span className="text-base sm:text-lg font-bold text-slate-500 dark:text-slate-300 font-mono ml-2 select-none shrink-0 whitespace-nowrap">
                VND
              </span>
            </div>

            {errors.limit && (
              <p id="budget-limit-error" className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.limit}</span>
              </p>
            )}

            {/* Nút gợi ý hạn mức nhanh */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-300 font-medium mr-1">
                Gợi ý nhanh:
              </span>
              {QUICK_BUDGET_AMOUNTS.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleQuickAdd(item.value)}
                  className="text-xs font-mono font-medium px-2.5 py-1 rounded-xl bg-white/70 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 border border-white/80 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs backdrop-blur-xs transition-all hover:scale-[1.02] cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* ========================================================================= */}
        {/* FOOTER: CANCEL & SAVE ACTIONS */}
        {/* ========================================================================= */}
        <div className="p-4 sm:px-6 sm:py-4.5 border-t border-white/60 dark:border-slate-800/60 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex items-center justify-between gap-3 shrink-0 rounded-b-3xl">
          {initialBudget && onDelete ? (
            <Button
              variant="danger"
              size="md"
              type="button"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => {
                onClose()
                onDelete(initialBudget)
              }}
              className="cursor-pointer rounded-2xl"
            >
              Xóa ngân sách
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-2xl font-medium"
            >
              Hủy
            </Button>

            <Button
              variant="primary"
              size="md"
              type="submit"
              form="create-budget-form"
              disabled={isSubmitting || !!duplicateBudget}
              isLoading={isSubmitting}
              loadingText="Đang lưu hạn mức..."
              leftIcon={<Plus className="w-4 h-4" />}
              className="rounded-2xl shadow-sm"
            >
              Lưu hạn mức
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export const CreateBudgetModal: React.FC<CreateBudgetModalProps> = ({
  isOpen,
  ...props
}) => {
  if (!isOpen) return null
  return <CreateBudgetModalContent {...props} />
}
