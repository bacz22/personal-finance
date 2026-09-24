import React, { forwardRef, useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helperText?: string
  error?: string
  fullWidth?: boolean
  showCount?: boolean
  countSuffix?: string
  counter?: React.ReactNode
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      fullWidth = true,
      showCount = false,
      countSuffix = ' ký tự',
      counter,
      disabled = false,
      required = false,
      className = '',
      id,
      maxLength,
      value,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const generatedId = useId()
    const textareaId = id || generatedId
    const errorId = `${textareaId}-error`
    const helperId = `${textareaId}-helper`

    const currentLength =
      typeof value === 'string'
        ? value.length
        : props.defaultValue
        ? String(props.defaultValue).length
        : 0

    return (
      <div className={`${fullWidth ? 'w-full' : ''} space-y-1.5`}>
        {/* Label and Character Count */}
        {(label || counter || (showCount && maxLength !== undefined)) && (
          <div className="flex items-center justify-between">
            {label ? (
              <label
                htmlFor={textareaId}
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 block select-none"
              >
                {label}
                {required && <span className="text-rose-500 ml-1">*</span>}
              </label>
            ) : (
              <span />
            )}

            {counter ? (
              counter
            ) : showCount && maxLength !== undefined ? (
              <span
                className={cn(
                  'text-[11px] font-mono tabular-nums select-none',
                  currentLength > maxLength
                    ? 'text-rose-600 dark:text-rose-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500'
                )}
              >
                {currentLength}/{maxLength}
                {countSuffix}
              </span>
            ) : null}
          </div>
        )}

        {/* Textarea Input */}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          rows={rows}
          value={value}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full text-sm rounded-2xl transition-all duration-200 p-3 border shadow-2xs focus:outline-none resize-none backdrop-blur-[var(--glass-blur,16px)]',
            disabled
              ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/50 cursor-not-allowed select-none'
              : error
              ? 'border-rose-400 dark:border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 placeholder:text-slate-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.9)]'
              : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 bg-white/85 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900/95 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] focus:shadow-[0_0_16px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)]',
            className
          )}
          {...props}
        />

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

Textarea.displayName = 'Textarea'
