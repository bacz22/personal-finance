import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  AlertTriangle,
  AlertOctagon,
  Trash2,
  X,
  Calendar,
} from 'lucide-react'
import { Button, CurrencyText } from '../ui'
import { getCategoryBadgeStyle } from '@/tokens'
import { type BudgetItem } from './types'

export interface DeleteBudgetDialogProps {
  isOpen: boolean
  budget: BudgetItem | null
  onClose: () => void
  onConfirm: (budget: BudgetItem) => Promise<void> | void
}

export const DeleteBudgetDialog: React.FC<DeleteBudgetDialogProps> = ({
  isOpen,
  budget,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const handleClose = useCallback(() => {
    setDeleteError(null)
    onClose()
  }, [onClose])

  // Focus management: lưu focus cũ và autofocus vào nút Hủy để tránh bấm nhầm Enter
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      document.body.style.overflow = 'hidden'

      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus()
      }, 80)

      return () => {
        clearTimeout(timer)
        document.body.style.overflow = 'unset'
        previousFocusRef.current?.focus()
      }
    }
  }, [isOpen])

  // Lắng nghe phím Escape và Focus Trap cho Tab
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        handleClose()
        return
      }

      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
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
  }, [isOpen, isDeleting, handleClose])

  if (!isOpen || !budget) return null

  const Icon = budget.categoryIcon

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onConfirm(budget)
      handleClose()
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : 'Không thể xóa ngân sách. Vui lòng thử lại sau.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop mờ tối */}
      <div
        className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => !isDeleting && handleClose()}
        aria-hidden="true"
      />

      {/* Dialog Box (alertdialog) */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-budget-dialog-title"
        aria-describedby="delete-budget-dialog-desc"
        className="relative w-full max-w-md bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl shadow-[0_20px_60px_rgba(15,23,42,0.12),0_4px_20px_rgba(0,0,0,0.04)] border border-white/80 dark:border-slate-700/60 p-5 sm:p-6 z-10 animate-in zoom-in-95 fade-in duration-200 space-y-4"
      >
        {/* Nút đóng góc phải */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClose}
          disabled={isDeleting}
          aria-label="Đóng hộp thoại"
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 hover:bg-white/60 rounded-2xl p-2 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </Button>

        {/* Header Icon cảnh báo */}
        <div className="flex flex-col items-center text-center space-y-2.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 flex items-center justify-center shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div>
            <h3
              id="delete-budget-dialog-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight"
            >
              Xác nhận xóa ngân sách
            </h3>
            <p
              id="delete-budget-dialog-desc"
              className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs mx-auto"
            >
              Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa hạn mức ngân sách này khỏi tháng {budget.month}/{budget.year}?
            </p>
          </div>
        </div>

        {/* Chi tiết ngân sách sắp xóa */}
        <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/80 dark:border-slate-700/60 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-white/80"
              style={getCategoryBadgeStyle(budget.categoryColor)}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {budget.categoryName}
              </h4>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                <Calendar className="w-3 h-3 text-slate-400" />
                Tháng {budget.month}/{budget.year}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Hạn mức đã đặt:</span>
            <CurrencyText
              amount={budget.budgetLimit}
              size="sm"
              className="font-bold font-mono text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Đã chi tiêu:</span>
            <CurrencyText
              amount={budget.spent}
              size="sm"
              className="font-mono text-slate-700 dark:text-slate-300"
            />
          </div>
        </div>

        {/* Thông báo lỗi nếu xóa thất bại */}
        {deleteError && (
          <div
            role="alert"
            className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in duration-150"
          >
            <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-rose-900 dark:text-rose-100">Không thể xóa ngân sách</p>
              <p className="mt-0.5 text-rose-700 dark:text-rose-300 leading-relaxed">{deleteError}</p>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            ref={cancelButtonRef}
            variant="secondary"
            size="md"
            onClick={handleClose}
            disabled={isDeleting}
            className="flex-1 justify-center rounded-2xl cursor-pointer"
          >
            Hủy
          </Button>

          <Button
            variant="danger"
            size="md"
            onClick={handleConfirmDelete}
            isLoading={isDeleting}
            loadingText="Đang xóa..."
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="flex-1 justify-center rounded-2xl cursor-pointer shadow-xs"
          >
            Xóa ngân sách
          </Button>
        </div>
      </div>
    </div>
  )
}
