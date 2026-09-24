import React, { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:via-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-bold border-t border-white/50 border-x border-emerald-400/30 border-b border-emerald-800/40 shadow-[0_6px_22px_rgba(16,185,129,0.36),inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.15)] backdrop-blur-md focus-visible:ring-emerald-500/50',
  secondary:
    'bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl text-slate-700 dark:text-slate-200 font-bold border border-white/95 dark:border-white/20 hover:border-white hover:bg-white/95 dark:hover:bg-slate-700/90 active:scale-[0.98] shadow-[0_4px_16px_rgba(15,23,42,0.06),inset_0_1px_2px_rgba(255,255,255,0.95)] focus-visible:ring-slate-400/50',
  outline:
    'bg-transparent border border-white/80 dark:border-white/20 text-slate-700 dark:text-slate-200 font-semibold hover:bg-white/60 dark:hover:bg-slate-800/60 hover:border-white active:scale-[0.98] backdrop-blur-xs shadow-2xs focus-visible:ring-slate-400/50',
  ghost:
    'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60 active:scale-[0.98] focus-visible:ring-slate-400/50',
  danger:
    'bg-rose-500/15 backdrop-blur-md border border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 active:scale-[0.98] shadow-[0_4px_16px_rgba(244,63,94,0.18),inset_0_1px_1px_rgba(255,255,255,0.6)] focus-visible:ring-rose-500/50',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl gap-1.5 min-h-[32px]',
  md: 'px-4 py-2 text-sm rounded-2xl gap-2 min-h-[40px]',
  lg: 'px-5 py-2.5 text-base rounded-2xl gap-2.5 min-h-[44px]',
  icon: 'p-2 rounded-full justify-center min-w-[36px] min-h-[36px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isButtonDisabled = disabled || isLoading

    return (
      <button
        ref={ref}
        type={type}
        disabled={isButtonDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          isButtonDisabled
            ? 'opacity-45 saturate-50 cursor-not-allowed pointer-events-none active:scale-100 shadow-none'
            : 'cursor-pointer',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
