import React from 'react'
import { X } from 'lucide-react'

export type BadgeVariant = 'income' | 'expense' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  withDot?: boolean
  pulseDot?: boolean
  icon?: React.ReactNode
  onRemove?: () => void
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  income: {
    container:
      'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-500/20 backdrop-blur-md border border-emerald-300/80 dark:border-emerald-500/30 shadow-[0_2px_8px_rgba(16,185,129,0.14),inset_0_1px_1px_rgba(255,255,255,0.85)] font-semibold',
    dot: 'bg-emerald-500',
  },
  success: {
    container:
      'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 dark:bg-emerald-500/20 backdrop-blur-md border border-emerald-300/80 dark:border-emerald-500/30 shadow-[0_2px_8px_rgba(16,185,129,0.14),inset_0_1px_1px_rgba(255,255,255,0.85)] font-semibold',
    dot: 'bg-emerald-500',
  },
  expense: {
    container:
      'text-rose-700 dark:text-rose-300 bg-rose-500/15 dark:bg-rose-500/20 backdrop-blur-md border border-rose-300/80 dark:border-rose-500/30 shadow-[0_2px_8px_rgba(244,63,94,0.14),inset_0_1px_1px_rgba(255,255,255,0.85)] font-semibold',
    dot: 'bg-rose-500',
  },
  danger: {
    container:
      'text-red-700 dark:text-red-300 bg-red-500/16 dark:bg-red-500/20 backdrop-blur-md border border-red-300/80 dark:border-red-500/30 shadow-[0_2px_8px_rgba(239,68,68,0.14),inset_0_1px_1px_rgba(255,255,255,0.85)] font-semibold',
    dot: 'bg-red-500',
  },
  warning: {
    container:
      'text-amber-700 dark:text-amber-300 bg-amber-500/15 dark:bg-amber-500/20 backdrop-blur-md border border-amber-300/80 dark:border-amber-500/30 shadow-[0_2px_8px_rgba(245,158,11,0.14),inset_0_1px_1px_rgba(255,255,255,0.85)] font-semibold',
    dot: 'bg-amber-500',
  },
  info: {
    container:
      'text-blue-700 dark:text-blue-300 bg-blue-500/15 dark:bg-blue-500/20 backdrop-blur-md border border-blue-300/80 dark:border-blue-500/30 shadow-[0_2px_8px_rgba(59,130,246,0.14),inset_0_1px_1px_rgba(255,255,255,0.85)] font-semibold',
    dot: 'bg-blue-500',
  },
  neutral: {
    container:
      'text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-white/90 dark:border-white/10 shadow-[0_2px_8px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.85)] font-semibold',
    dot: 'bg-slate-500',
  },
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[11px] px-2 py-0.5 rounded-full gap-1',
  md: 'text-xs px-2.5 py-1 rounded-full gap-1.5',
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  withDot = false,
  pulseDot = false,
  icon,
  onRemove,
  className = '',
  ...props
}) => {
  const styles = variantStyles[variant]

  return (
    <span
      className={`inline-flex items-center font-medium border select-none ${styles.container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {withDot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulseDot && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${styles.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${styles.dot}`} />
        </span>
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-1 -mr-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer inline-flex items-center justify-center focus:outline-none"
          aria-label="Xóa"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
