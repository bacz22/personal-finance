import React, { forwardRef, useState, useId } from 'react'
import { Eye, EyeOff, AlertCircle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  showPasswordToggle?: boolean
  onClear?: () => void
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      showPasswordToggle = true,
      onClear,
      type = 'text',
      disabled = false,
      required = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const [showPassword, setShowPassword] = useState(false)
    const isPasswordType = type === 'password'
    const actualType = isPasswordType && showPassword ? 'text' : type

    return (
      <div className={`${fullWidth ? 'w-full' : ''} space-y-1.5`}>
        {/* Real Label */}
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-xs font-semibold text-slate-700 dark:text-slate-200 block select-none"
            >
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </label>
          </div>
        )}

        {/* Input Wrapper */}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 z-10 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={actualType}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full text-sm rounded-2xl transition-all duration-200 py-2.5 border focus:outline-none backdrop-blur-[var(--glass-blur,16px)]',
              leftIcon ? 'pl-10' : 'pl-3.5',
              isPasswordType || rightIcon ? 'pr-10' : 'pr-3.5',
              disabled
                ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/50 cursor-not-allowed select-none'
                : error
                ? 'border-rose-400 dark:border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.9)]'
                : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 bg-white/85 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900/95 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] focus:shadow-[0_0_16px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)]',
              className
            )}
            {...props}
          />

          {onClear && props.value ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onClear}
              className="absolute right-3 p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Xóa nội dung"
              aria-label="Xóa nội dung"
            >
              <X className="w-4 h-4" />
            </button>
          ) : isPasswordType && showPasswordToggle ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800 focus:outline-none focus:text-slate-700 dark:focus:text-slate-200 transition-colors disabled:pointer-events-none"
              title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          ) : (
            rightIcon && (
              <div className="absolute right-3.5 flex items-center pointer-events-none [&>*]:pointer-events-auto text-slate-400">
                {rightIcon}
              </div>
            )
          )}
        </div>

        {/* Error message or Helper text */}
        {error ? (
          <p
            id={errorId}
            className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5 font-medium mt-1 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {helperText}
          </p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
