import React from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'
import { Button } from './Button'

export interface DataLoadErrorProps {
  /** Tiêu đề thông báo lỗi */
  title?: string
  /** Nội dung giải thích chi tiết, thân thiện */
  message?: string
  /** Callback kích hoạt khi bấm nút Thử lại */
  onRetry?: () => void
  /** Nhãn của nút Thử lại */
  retryText?: string
  /** Trạng thái đang tải lại */
  isRetrying?: boolean
  /** Biến thể hiển thị */
  variant?: 'card' | 'full' | 'inline'
  className?: string
}

export const DataLoadError: React.FC<DataLoadErrorProps> = ({
  title = 'Không thể tải dữ liệu',
  message = 'Đã có lỗi xảy ra trong quá trình đồng bộ dữ liệu với hệ thống. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.',
  onRetry,
  retryText = 'Thử lại ngay',
  isRetrying = false,
  variant = 'card',
  className = '',
}) => {
  // Biến thể dạng inline banner mỏng
  if (variant === 'inline') {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 rounded-xl bg-rose-500/12 dark:bg-rose-950/60 backdrop-blur-md border border-rose-500/25 dark:border-rose-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-rose-900 dark:text-rose-200 shadow-xs ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-300 shrink-0" />
          <span>
            <strong className="font-semibold">{title}:</strong> {message}
          </span>
        </div>
        {onRetry && (
          <button
            type="button"
            disabled={isRetrying}
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-200 hover:text-rose-800 dark:hover:text-white bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-rose-300/60 dark:border-rose-800 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer transition-colors disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Đang thử lại...' : retryText}</span>
          </button>
        )}
      </div>
    )
  }

  // Biến thể Card & Full — Glass Tier 2 tinted rose
  const minHeightClass = variant === 'full' ? 'min-h-[460px]' : 'min-h-[320px]'

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[28px] border border-rose-200 dark:border-rose-900 shadow-[0_8px_24px_rgba(244,63,94,0.08)] p-8 sm:p-12 text-center flex flex-col items-center justify-center ${minHeightClass} ${className}`}
    >
      {/* Icon cảnh báo nền kính hồng */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-rose-500/14 dark:bg-rose-950/80 backdrop-blur-sm text-rose-600 dark:text-rose-300 border border-rose-500/25 dark:border-rose-900 flex items-center justify-center mb-4 shadow-xs ring-8 ring-rose-500/10">
        <AlertOctagon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[1.75]" />
      </div>

      {/* Tiêu đề lỗi thân thiện */}
      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug mb-2 tracking-tight">
        {title}
      </h3>

      {/* Thông điệp giải thích */}
      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed mb-6">
        {message}
      </p>

      {/* Nút hành động Thử lại */}
      {onRetry && (
        <Button
          variant="danger"
          size="md"
          disabled={isRetrying}
          onClick={onRetry}
          leftIcon={<RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />}
        >
          {isRetrying ? 'Đang kết nối lại...' : retryText}
        </Button>
      )}
    </div>
  )
}
