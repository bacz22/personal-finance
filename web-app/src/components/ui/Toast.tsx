import React, { useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import {
  ToastContext,
  type ToastType,
  type ToastOptions,
  type ToastItemData,
} from './toastContext'

const DEFAULT_DURATION = 4000

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItemData[]>([])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = options?.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
      const duration = options?.duration ?? DEFAULT_DURATION

      const newToast: ToastItemData = {
        id,
        type,
        message,
        title: options?.title,
        duration,
        action: options?.action,
        createdAt: Date.now(),
      }

      setToasts((prev) => {
        // Giới hạn tối đa 4 toasts cùng lúc để không choáng ngợp màn hình
        const filtered = prev.filter((t) => t.id !== id)
        if (filtered.length >= 4) {
          filtered.shift()
        }
        return [...filtered, newToast]
      })

      return id
    },
    []
  )

  const success = useCallback(
    (message: string, options?: ToastOptions) => showToast('success', message, options),
    [showToast]
  )
  const error = useCallback(
    (message: string, options?: ToastOptions) => showToast('error', message, options),
    [showToast]
  )
  const warning = useCallback(
    (message: string, options?: ToastOptions) => showToast('warning', message, options),
    [showToast]
  )
  const info = useCallback(
    (message: string, options?: ToastOptions) => showToast('info', message, options),
    [showToast]
  )

  // 4 hàm preset theo đặc tả Prompt 26
  const transactionAdded = useCallback(
    (title?: string) => {
      const msg = title
        ? `Đã ghi nhận giao dịch "${title}" thành công!`
        : 'Thêm giao dịch thành công!'
      return success(msg, { title: 'Thêm giao dịch' })
    },
    [success]
  )

  const transactionUpdated = useCallback(
    (title?: string) => {
      const msg = title
        ? `Đã cập nhật giao dịch "${title}" thành công!`
        : 'Cập nhật giao dịch thành công!'
      return success(msg, { title: 'Cập nhật giao dịch' })
    },
    [success]
  )

  const transactionDeleted = useCallback(
    (title?: string) => {
      const msg = title
        ? `Đã xóa giao dịch "${title}" thành công!`
        : 'Xóa giao dịch thành công!'
      return success(msg, { title: 'Xóa giao dịch' })
    },
    [success]
  )

  const budgetSaved = useCallback(
    (categoryName?: string) => {
      const msg = categoryName
        ? `Đã thiết lập ngân sách cho "${categoryName}" thành công!`
        : 'Thiết lập ngân sách thành công!'
      return success(msg, { title: 'Ngân sách' })
    },
    [success]
  )

  return (
    <ToastContext.Provider
      value={{
        showToast,
        dismissToast,
        success,
        error,
        warning,
        info,
        transactionAdded,
        transactionUpdated,
        transactionDeleted,
        budgetSaved,
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: ToastItemData[]
  onDismiss: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Thông báo hệ thống"
      aria-live="polite"
      className="fixed top-4 sm:top-6 left-3 right-3 sm:left-auto sm:right-6 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-auto sm:w-full mx-auto sm:mx-0 pointer-events-none"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: ToastItemData
  onDismiss: (id: string) => void
}

const toastStyles: Record<
  ToastType,
  {
    icon: React.ElementType
    iconClass: string
    badgeBg: string
    cardBg: string
    border: string
    shadow: string
    progressGradient: string
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-300 stroke-[2.5]',
    badgeBg:
      'bg-gradient-to-br from-emerald-400/25 via-emerald-500/15 to-teal-500/20 border border-emerald-300/80 dark:border-emerald-400/40 shadow-[0_4px_14px_rgba(16,185,129,0.22),inset_0_1.5px_2px_rgba(255,255,255,0.95)] backdrop-blur-xl',
    cardBg:
      'bg-gradient-to-br from-white/92 via-white/82 to-emerald-50/40 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-emerald-950/25',
    border: 'border-white/95 dark:border-white/15',
    shadow:
      'shadow-[0_20px_50px_rgba(16,185,129,0.14),0_0_0_1px_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset,0_1px_1px_rgba(255,255,255,0.15)_inset]',
    progressGradient: 'from-emerald-400 via-emerald-500 to-teal-500',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-600 dark:text-rose-300 stroke-[2.5]',
    badgeBg:
      'bg-gradient-to-br from-rose-400/25 via-rose-500/15 to-pink-500/20 border border-rose-300/80 dark:border-rose-400/40 shadow-[0_4px_14px_rgba(244,63,94,0.22),inset_0_1.5px_2px_rgba(255,255,255,0.95)] backdrop-blur-xl',
    cardBg:
      'bg-gradient-to-br from-white/92 via-white/82 to-rose-50/40 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-rose-950/25',
    border: 'border-white/95 dark:border-white/15',
    shadow:
      'shadow-[0_20px_50px_rgba(244,63,94,0.14),0_0_0_1px_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset,0_1px_1px_rgba(255,255,255,0.15)_inset]',
    progressGradient: 'from-rose-400 via-rose-500 to-pink-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-300 stroke-[2.5]',
    badgeBg:
      'bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-orange-500/20 border border-amber-300/80 dark:border-amber-400/40 shadow-[0_4px_14px_rgba(245,158,11,0.22),inset_0_1.5px_2px_rgba(255,255,255,0.95)] backdrop-blur-xl',
    cardBg:
      'bg-gradient-to-br from-white/92 via-white/82 to-amber-50/40 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-amber-950/25',
    border: 'border-white/95 dark:border-white/15',
    shadow:
      'shadow-[0_20px_50px_rgba(245,158,11,0.14),0_0_0_1px_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset,0_1px_1px_rgba(255,255,255,0.15)_inset]',
    progressGradient: 'from-amber-400 via-amber-500 to-orange-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-sky-600 dark:text-sky-300 stroke-[2.5]',
    badgeBg:
      'bg-gradient-to-br from-sky-400/25 via-blue-500/15 to-indigo-500/20 border border-sky-300/80 dark:border-sky-400/40 shadow-[0_4px_14px_rgba(14,165,233,0.22),inset_0_1.5px_2px_rgba(255,255,255,0.95)] backdrop-blur-xl',
    cardBg:
      'bg-gradient-to-br from-white/92 via-white/82 to-sky-50/40 dark:from-slate-900/90 dark:via-slate-900/82 dark:to-sky-950/25',
    border: 'border-white/95 dark:border-white/15',
    shadow:
      'shadow-[0_20px_50px_rgba(14,165,233,0.14),0_0_0_1px_rgba(255,255,255,0.85)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)_inset,0_1px_1px_rgba(255,255,255,0.15)_inset]',
    progressGradient: 'from-sky-400 via-blue-500 to-indigo-500',
  },
}

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const [isPaused, setIsPaused] = useState(false)
  const remainingTimeRef = useRef(toast.duration)
  const lastStartRef = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const config = toastStyles[toast.type]
  const Icon = config.icon

  // Quản lý timer tự đóng với tính năng pause on hover / focus
  useEffect(() => {
    if (toast.duration <= 0) return

    if (!isPaused) {
      lastStartRef.current = Date.now()
      timerRef.current = setTimeout(() => {
        onDismiss(toast.id)
      }, remainingTimeRef.current)
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      const elapsed = Date.now() - (lastStartRef.current || Date.now())
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isPaused, toast.duration, toast.id, onDismiss])

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      tabIndex={0}
      className={`pointer-events-auto relative overflow-hidden backdrop-blur-2xl text-slate-900 dark:text-slate-100 rounded-3xl border ${config.border} ${config.cardBg} ${config.shadow} p-3.5 sm:p-4 flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-top-4 fade-in focus:outline-none focus:ring-2 focus:ring-emerald-500/40 select-none group`}
    >
      {/* Icon trạng thái: Viên ngọc kính lỏng 3D */}
      <div
        className={`w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-200 ${config.badgeBg}`}
      >
        <Icon className={`w-5 h-5 ${config.iconClass}`} />
      </div>

      {/* Nội dung Toast */}
      <div className="flex-1 min-w-0 pr-1 pt-0.5">
        {toast.title && (
          <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight leading-snug">
            {toast.title}
          </p>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium break-words mt-0.5">
          {toast.message}
        </p>

        {/* Nút thao tác phụ đi kèm nếu có */}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick()
              onDismiss(toast.id)
            }}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 bg-white/70 dark:bg-slate-800/70 hover:bg-white/95 dark:hover:bg-slate-700/90 border border-white/90 dark:border-white/20 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md transition-all active:scale-95 cursor-pointer"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Nút đóng thông báo: Thỏi kính nổi (Floating Glass Pebble) */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white bg-white/60 hover:bg-white/95 dark:bg-slate-800/60 dark:hover:bg-slate-700/80 border border-white/90 dark:border-white/20 shadow-[0_2px_6px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.9)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
        aria-label="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
      </button>

      {/* Thanh tiến trình đếm ngược thời gian nếu có auto-close */}
      {toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/40 dark:bg-slate-800/40 backdrop-blur-xs overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${config.progressGradient} shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all duration-100 ease-linear`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          />
        </div>
      )}
    </div>
  )
}
