import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Tag,
  Check,
} from 'lucide-react'
import { DatePicker, Select, Input, Button, Tabs, Textarea } from '../ui'
import { type CategoryOption, type Transaction } from './types'
import { getCategoryBadgeStyle } from '../../tokens'
import { MAX_UI_MONEY, formatMoneyDigits } from '../../money'

function formatDateDisplay(isoStr?: string): string {
  if (!isoStr) return ''
  const parts = isoStr.split('-')
  if (parts.length !== 3) return isoStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function getLocalDateString(): string {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

// =========================================================================
// TYPES & PROPS
// =========================================================================
export interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (transaction: Transaction) => void | Promise<void>
  /** Chế độ thêm mới, chỉnh sửa hoặc xem chi tiết (mặc định 'add') */
  mode?: 'add' | 'edit' | 'view'
  /** Dữ liệu khởi tạo (dùng khi chỉnh sửa hoặc xem) */
  initialData?: Partial<Transaction> | null
  /** Callback khi người dùng bấm Sửa từ chế độ xem */
  onEdit?: (transaction: Transaction) => void
  /** Danh mục do API cung cấp */
  categoryOptions?: CategoryOption[]
}

const QUICK_AMOUNTS = [
  { label: '+50k', value: 50000 },
  { label: '+100k', value: 100000 },
  { label: '+200k', value: 200000 },
  { label: '+500k', value: 500000 },
  { label: '+1Tr', value: 1000000 },
]

interface TransactionModalContentProps extends Omit<TransactionModalProps, 'isOpen'> {}

const TransactionModalContent: React.FC<TransactionModalContentProps> = ({
  onClose,
  onSuccess,
  mode = 'add',
  initialData,
  onEdit: _onEdit,
  categoryOptions = [],
}) => {
  const isEdit = mode === 'edit'
  const isView = mode === 'view'

  // Focus management ref
  const amountInputRef = useRef<HTMLInputElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)

  // Khởi tạo State trực tiếp từ initialData mà không cần setState trong useEffect
  const [type, setType] = useState<'income' | 'expense'>(() => initialData?.type || 'expense')
  const [amountStr, setAmountStr] = useState<string>(() =>
    initialData?.amount ? String(initialData.amount) : ''
  )
  const [title, setTitle] = useState<string>(() => initialData?.title || '')
  const [category, setCategory] = useState<string>(() => initialData?.categoryId || '')
  const [date, setDate] = useState<string>(() => initialData?.date || getLocalDateString())
  const [note, setNote] = useState<string>(() => initialData?.note || '')

  // Validation errors & states
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false)

  // Tính toán dirty state để ngăn vô tình mất thay đổi khi đóng dialog
  const isDirty = React.useMemo(() => {
    if (isView) return false
    const initType = initialData?.type || 'expense'
    const initAmount = initialData?.amount ? String(initialData.amount) : ''
    const initTitle = initialData?.title || ''
    const initCategory = initialData?.categoryId || ''
    const initDate = initialData?.date || getLocalDateString()
    const initNote = initialData?.note || ''

    return (
      type !== initType ||
      amountStr !== initAmount ||
      title !== initTitle ||
      category !== initCategory ||
      date !== initDate ||
      note !== initNote
    )
  }, [isView, type, amountStr, title, category, date, note, initialData])

  // Xử lý yêu cầu đóng (nếu có thay đổi chưa lưu thì hỏi xác nhận)
  const handleRequestClose = React.useCallback(() => {
    if (isDirty && !isSubmitting) {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }, [isDirty, isSubmitting, onClose])

  // Quản lý khóa cuộn trang và hoàn trả focus khi đóng modal
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    // Focus vào ô nhập số tiền sau khi modal render (chỉ khi thêm hoặc sửa)
    const timer = setTimeout(() => {
      if (!isView) {
        amountInputRef.current?.focus()
      }
    }, 80)

    return () => {
      clearTimeout(timer)
      document.body.style.overflow = 'unset'
      previousFocus?.focus()
    }
  }, [isView])

  // Lắng nghe phím Escape và Focus Trap cho Tab
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false)
        } else {
          handleRequestClose()
        }
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
  }, [isSubmitting, showDiscardConfirm, handleRequestClose])

  // Danh mục hợp lệ theo loại (Income chỉ hiện income, Expense chỉ hiện expense)
  const availableCategories = categoryOptions.filter(
    (c) => c.type === type && (c.active !== false || c.value === initialData?.categoryId),
  )

  // Định dạng danh sách lựa chọn cho component Select dùng chung kèm icon và màu nhận diện
  const categorySelectOptions = React.useMemo(() => {
    return availableCategories.map((cat) => {
      const CatIcon = cat.icon
      const color = cat.color || '#64748B'
      return {
        value: cat.value,
        label: cat.label,
        icon: (
          <span
            className="w-6 h-6 rounded-xl flex items-center justify-center shrink-0 shadow-2xs border border-white/60"
            style={getCategoryBadgeStyle(color)}
          >
            {CatIcon ? <CatIcon className="w-3.5 h-3.5" /> : <Tag className="w-3.5 h-3.5" />}
          </span>
        ),
      }
    })
  }, [availableCategories])

  // Chuyển đổi loại giao dịch Thu <-> Chi
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType)
    setSubmitError(null)
    // Tự động chọn danh mục mặc định phù hợp với loại mới để tránh category không còn hợp lệ
    setCategory('')
    if (errors.category) {
      setErrors((prev) => ({ ...prev, category: '' }))
    }
  }

  // Xử lý nhập số tiền (chỉ chấp nhận số nguyên, định dạng hiển thị)
  const handleAmountChange = (val: string) => {
    const cleanDigits = val.replace(/\D/g, '')
    setAmountStr(cleanDigits)
    setSubmitError(null)
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }))
    }
  }

  // Cộng dồn nhanh số tiền
  const handleQuickAddAmount = (addVal: number) => {
    const currentNum = Number(amountStr) || 0
    const nextNum = currentNum + addVal
    setAmountStr(String(nextNum))
    setSubmitError(null)
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: '' }))
    }
  }

  // Format số tiền hiển thị phân tách hàng nghìn
  const formattedDisplayAmount = amountStr
    ? formatMoneyDigits(amountStr)
    : ''

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const numAmount = Number(amountStr)

    if (!amountStr || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Vui lòng nhập số tiền hợp lệ và lớn hơn 0 ₫'
    } else if (numAmount > MAX_UI_MONEY) {
      newErrors.amount = `Số tiền tối đa là ${MAX_UI_MONEY.toLocaleString('vi-VN')} ₫`
    }

    if (!title.trim()) {
      newErrors.title = 'Vui lòng nhập nội dung giao dịch'
    } else if (title.trim().length > 100) {
      newErrors.title = 'Nội dung giao dịch tối đa 100 ký tự'
    }

    if (!category) {
      newErrors.category = 'Vui lòng chọn danh mục giao dịch'
    }

    if (!date) {
      newErrors.date = 'Vui lòng chọn ngày giao dịch'
    }

    if (note.length > 255) {
      newErrors.note = 'Ghi chú không được vượt quá 255 ký tự'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Xử lý gửi Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    const selectedCategoryObj = availableCategories.find((c) => c.value === category)
    const updatedTransaction: Transaction = {
      id: initialData?.id || '',
      title: title.trim(),
      categoryId: category,
      category: selectedCategoryObj?.label || initialData?.category || '',
      categoryIcon: selectedCategoryObj?.icon,
      categoryColor: selectedCategoryObj?.color,
      amount: Number(amountStr),
      type,
      date,
      account: initialData?.account,
      note: note.trim() || undefined,
    }

    setIsSubmitting(true)
    setSubmitError(null)
    let saved = false
    try {
      await onSuccess?.(updatedTransaction)
      saved = true
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Không thể lưu giao dịch. Vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
    if (saved) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop: Làm mờ sâu (backdrop-blur-xl) biến nền trang thành ánh sáng bokeh mượt mà */}
      <div
        className="fixed inset-0 bg-slate-950/35 backdrop-blur-xl transition-opacity animate-in fade-in duration-200"
        onClick={() => !isSubmitting && handleRequestClose()}
        aria-hidden="true"
      />

      {/* Modal Popup Container: Chuẩn Liquid Glass với bề mặt kính trong mờ cao cấp, viền phản quang trắng và đổ bóng đa tầng */}
      <div
        ref={modalContainerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        className="relative w-full max-w-lg bg-[rgba(255,255,255,0.82)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl rounded-3xl shadow-[0_25px_60px_-15px_rgba(15,23,42,0.22),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.9)_inset] border border-white/85 dark:border-white/10 z-10 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden animate-in zoom-in-95 fade-in duration-200 my-auto"
      >
        {/* ========================================================================= */}
        {/* LỚP PHỦ XÁC NHẬN HỦY THAY ĐỔI KHI FORM BỊ DIRTY */}
        {/* ========================================================================= */}
        {showDiscardConfirm && (
          <div className="absolute inset-0 z-30 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-3xl p-5 max-w-xs w-full shadow-2xl border border-white/80 dark:border-slate-700 text-center space-y-3 animate-in zoom-in-95 duration-150">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/60 flex items-center justify-center mx-auto shadow-2xs">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Hủy bỏ thay đổi?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Bạn có các thông tin đã chỉnh sửa nhưng chưa lưu. Bạn có chắc chắn muốn hủy bỏ không?
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 justify-center rounded-xl font-semibold"
                >
                  Tiếp tục sửa
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowDiscardConfirm(false)
                    onClose()
                  }}
                  className="flex-1 justify-center rounded-xl font-semibold"
                >
                  Hủy bỏ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* HEADER MODAL: Phong cách Liquid Glass với dải gradient ánh sáng mờ dần */}
        {/* ========================================================================= */}
        <div className="px-5 sm:px-6 py-4.5 border-b border-white/60 dark:border-white/10 flex items-center justify-between bg-gradient-to-b from-white/80 via-white/50 to-white/20 dark:from-slate-800/80 dark:via-slate-800/50 dark:to-slate-800/20 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all backdrop-blur-xl ${
                type === 'income'
                  ? 'bg-gradient-to-br from-emerald-400/25 via-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-400/30 shadow-[0_4px_16px_rgba(16,185,129,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.95)]'
                  : 'bg-gradient-to-br from-rose-400/25 via-rose-500/15 to-pink-500/20 text-rose-600 dark:text-rose-300 border-rose-300/80 dark:border-rose-400/30 shadow-[0_4px_16px_rgba(244,63,94,0.2),inset_0_1.5px_2px_rgba(255,255,255,0.95)]'
              }`}
            >
              {type === 'income' ? (
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              ) : (
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="transaction-modal-title"
                  className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight"
                >
                  {isView
                    ? 'Chi tiết giao dịch'
                    : isEdit
                    ? 'Chỉnh sửa giao dịch'
                    : 'Thêm giao dịch mới'}
                </h2>
                {isView && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Chế độ xem
                  </span>
                )}
                {isEdit && isDirty && (
                  <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50">
                    Đã sửa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                {isView
                  ? `${initialData?.id ? `Mã: #${initialData.id} • ` : ''}Ngày ${formatDateDisplay(date)}`
                  : isEdit
                  ? 'Cập nhật lại thông tin giao dịch tài chính đã chọn'
                  : 'Ghi chép chi tiêu hoặc thu nhập hàng ngày'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={isView ? onClose : handleRequestClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white bg-white/70 hover:bg-white/95 dark:bg-slate-800/70 dark:hover:bg-slate-700/90 border border-white/90 dark:border-white/20 shadow-[0_2px_10px_rgba(15,23,42,0.06),inset_0_1px_1.5px_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.15)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
          >
            <X className="w-4.5 h-4.5 stroke-[2.5]" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* BODY: FORM GIAO DỊCH (DÙNG CHUNG CHO CẢ CHẾ ĐỘ XEM, THÊM VÀ SỬA) */}
        {/* ========================================================================= */}
        <form
          id="transaction-form"
          noValidate
          onSubmit={isView ? (e) => e.preventDefault() : handleSubmit}
          className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-transparent"
        >
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* 1. PHÂN LOẠI THU / CHI: SEGMENTED CONTROL */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5 select-none">
              Loại giao dịch <span className="text-rose-500">*</span>
            </label>
            <Tabs<'expense' | 'income'>
              value={type}
              onChange={(newVal) => !isView && handleTypeChange(newVal)}
              size="md"
              fullWidth
              containerClassName="w-full"
              tabs={[
                {
                  id: 'expense',
                  label: '- Khoản Chi tiêu',
                  icon: <TrendingDown className="w-4 h-4" />,
                  activeColor: 'rose',
                  disabled: isView,
                },
                {
                  id: 'income',
                  label: '+ Khoản Thu nhập',
                  icon: <TrendingUp className="w-4 h-4" />,
                  activeColor: 'emerald',
                  disabled: isView,
                },
              ]}
            />
          </div>

          {/* 2. SỐ TIỀN (HERO FIELD: NỔI BẬT NHẤT TRONG FORM) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="transaction-amount-input"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 block select-none"
              >
                Số tiền giao dịch <span className="text-rose-500">*</span>
              </label>
              {formattedDisplayAmount && (
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                  {type === 'income' ? '+' : '-'}{formattedDisplayAmount} ₫
                </span>
              )}
            </div>

            <div
              className={`relative flex items-center rounded-3xl border transition-all duration-200 p-3.5 sm:p-4 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04),inset_0_1px_2px_rgba(255,255,255,0.95)] ${
                isView
                  ? 'bg-white/50 dark:bg-slate-800/50 border-white/80 dark:border-white/10'
                  : errors.amount
                  ? 'border-rose-400 ring-4 ring-rose-500/20 bg-rose-50/60 dark:bg-rose-950/40'
                  : type === 'income'
                  ? 'border-emerald-300/80 dark:border-emerald-500/30 hover:border-emerald-400 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/20 bg-gradient-to-br from-emerald-500/12 via-white/70 to-teal-500/8 dark:from-emerald-500/20 dark:via-slate-800/70 dark:to-teal-500/15'
                  : 'border-rose-300/80 dark:border-rose-500/30 hover:border-rose-400 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/20 bg-gradient-to-br from-rose-500/12 via-white/70 to-pink-500/8 dark:from-rose-500/20 dark:via-slate-800/70 dark:to-pink-500/15'
              }`}
            >
              {/* Ký hiệu + hoặc - */}
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center font-black font-mono text-2xl select-none mr-3 shrink-0 shadow-xs border transition-colors ${
                  type === 'income'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-500/40 backdrop-blur-md'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-300/70 dark:border-rose-500/40 backdrop-blur-md'
                }`}
              >
                {type === 'income' ? '+' : '-'}
              </div>

              {/* Input số tiền */}
              <input
                ref={amountInputRef}
                id="transaction-amount-input"
                type="text"
                inputMode="numeric"
                readOnly={isView}
                disabled={isView}
                value={formattedDisplayAmount}
                onChange={(e) => !isView && handleAmountChange(e.target.value)}
                placeholder="0"
                aria-invalid={!!errors.amount}
                aria-describedby={errors.amount ? 'amount-error' : undefined}
                className={`w-full text-2xl sm:text-3xl font-black font-mono tracking-tight bg-transparent focus:outline-none placeholder-slate-300/80 dark:placeholder-slate-600 ${
                  isView ? 'cursor-default' : ''
                } ${
                  type === 'income'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }`}
              />

              {/* Đơn vị tiền tệ */}
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono ml-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-white/90 dark:border-white/10 shadow-2xs backdrop-blur-md select-none shrink-0">
                VND
              </span>
            </div>

            {errors.amount && (
              <p id="amount-error" className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.amount}</span>
              </p>
            )}

            {/* Nút cộng dồn nhanh số tiền (Chỉ hiển thị khi thêm hoặc sửa) */}
            {!isView && (
              <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar pt-0.5">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium mr-1 select-none shrink-0">
                  Gợi ý nhanh:
                </span>
                {QUICK_AMOUNTS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleQuickAddAmount(item.value)}
                    className="text-[11px] sm:text-xs font-mono font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-700 border border-white/90 dark:border-white/15 backdrop-blur-md text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300 shrink-0"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. NỘI DUNG / TIÊU ĐỀ GIAO DỊCH: DÙNG COMPONENT INPUT DÙNG CHUNG (KHÔNG DÙNG LEFTICON ĐỂ KHÔNG BỊ THỤT LỀ) */}
          <Input
            id="transaction-title-input"
            label="Nội dung giao dịch"
            required
            type="text"
            disabled={isView || availableCategories.length === 0}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setSubmitError(null)
              if (errors.title) setErrors((prev) => ({ ...prev, title: '' }))
            }}
            placeholder={
              type === 'income'
                ? 'Ví dụ: Lương công ty tháng 9, Thưởng dự án...'
                : 'Ví dụ: Ăn trưa văn phòng, Tiền điện nước sinh hoạt...'
            }
            error={errors.title}
          />

          {/* 4. DANH MỤC THU / CHI: SỬ DỤNG COMPONENT SELECT DÙNG CHUNG */}
          <Select
            label={`Danh mục ${type === 'income' ? '(Thu nhập)' : '(Chi tiêu)'}`}
            required
            disabled={isView}
            options={categorySelectOptions}
            value={category}
            onChange={(val) => {
              if (isView) return
              setCategory(String(val))
              setSubmitError(null)
              if (errors.category) setErrors((prev) => ({ ...prev, category: '' }))
            }}
            error={errors.category}
            placeholder={availableCategories.length ? 'Chọn danh mục thu chi...' : 'Chưa có danh mục'}
            helperText={availableCategories.length === 0 ? 'Hãy tạo hoặc kích hoạt danh mục phù hợp trước khi ghi giao dịch.' : undefined}
          />

          {/* 5. NGÀY GIAO DỊCH (MẶC ĐỊNH HÔM NAY HOẶC PREFILL) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block select-none">
              Ngày giao dịch <span className="text-rose-500">*</span>
            </label>
            <div className={`w-full ${isView ? 'pointer-events-none select-none' : ''}`}>
              <DatePicker
                mode="date"
                variant="input"
                disabled={isView}
                value={date}
                placeholder="Chọn ngày giao dịch..."
                onChange={(val) => {
                  if (isView) return
                  setDate(val)
                  setSubmitError(null)
                  if (errors.date) setErrors((prev) => ({ ...prev, date: '' }))
                }}
              />
            </div>
            {errors.date && (
              <p className="text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1 font-medium animate-in fade-in duration-150">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{errors.date}</span>
              </p>
            )}
          </div>

          {/* 6. GHI CHÚ: SỬ DỤNG COMPONENT TEXTAREA DÙNG CHUNG (TỐI ĐA 255 KÝ TỰ) */}
          <Textarea
            id="transaction-note-textarea"
            label="Ghi chú thêm"
            rows={2}
            maxLength={255}
            showCount={!isView}
            countSuffix=" ký tự"
            disabled={isView}
            readOnly={isView}
            value={note}
            onChange={(e) => {
              if (isView) return
              setNote(e.target.value)
              setSubmitError(null)
              if (errors.note) setErrors((prev) => ({ ...prev, note: '' }))
            }}
            placeholder={
              isView
                ? note
                  ? ''
                  : 'Không có ghi chú thêm'
                : 'Ghi chú chi tiết địa điểm, người cùng tham gia, hóa đơn...'
            }
            error={errors.note}
          />
        </form>

        {/* ========================================================================= */}
        {/* FOOTER: Kính lỏng gradient dâng lên từ đáy, đồng bộ Liquid Glass hoàn hảo */}
        {/* ========================================================================= */}
        {isView ? (
          <div className="sticky bottom-0 z-20 p-4 sm:px-6 sm:py-4.5 bg-gradient-to-t from-white/85 via-white/55 to-white/25 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/25 border-t border-white/60 dark:border-white/10 backdrop-blur-xl flex flex-row items-center justify-between gap-3 shrink-0 rounded-b-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              {initialData?.id ? `Mã: #${initialData.id}` : ''}
            </span>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={onClose}
                className="w-full sm:w-auto justify-center min-w-[120px] h-11 px-6 font-bold"
              >
                Đóng
              </Button>
            </div>
          </div>
        ) : (
          <div className="sticky bottom-0 z-20 p-4 sm:px-6 sm:py-4.5 bg-gradient-to-t from-white/85 via-white/55 to-white/25 dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-900/25 border-t border-white/60 dark:border-white/10 backdrop-blur-xl flex flex-row items-center justify-end gap-3 shrink-0 rounded-b-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
            <Button
              variant="secondary"
              size="md"
              onClick={handleRequestClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial justify-center min-w-[110px] h-11 px-6 font-bold"
            >
              Hủy
            </Button>

            <Button
              variant="primary"
              size="md"
              type="submit"
              form="transaction-form"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText={isEdit ? 'Đang cập nhật...' : 'Đang lưu giao dịch...'}
              leftIcon={isEdit ? <Check className="w-4.5 h-4.5 stroke-[2.5]" /> : <Plus className="w-4.5 h-4.5 stroke-[2.5]" />}
              className="flex-1 sm:flex-initial justify-center min-w-[150px] h-11 px-6 font-bold tracking-wide"
            >
              {isEdit ? 'Cập nhật' : 'Lưu giao dịch'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, ...props }) => {
  if (!isOpen) return null
  return <TransactionModalContent {...props} />
}
