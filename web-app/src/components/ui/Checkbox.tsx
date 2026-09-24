import React, { forwardRef, useId } from 'react'
import { Check } from 'lucide-react'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode
  description?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, disabled = false, checked, className = '', id, ...props }, ref) => {
    const generatedId = useId()
    const checkboxId = id || generatedId

    return (
      <div className="flex items-start gap-2.5 select-none">
        <div className="relative flex items-center mt-0.5">
          <input
            ref={ref}
            id={checkboxId}
            type="checkbox"
            checked={checked}
            disabled={disabled}
            className={`peer appearance-none w-4 h-4 rounded-md border transition-all duration-150 cursor-pointer bg-white/70 dark:bg-slate-900/80 backdrop-blur-sm ${
              disabled
                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                : 'border-slate-300/80 dark:border-slate-600 hover:border-emerald-500 checked:bg-emerald-600/95 checked:border-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30'
            } ${className}`}
            {...props}
          />
          <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity stroke-[3]" />
        </div>

        {(label || description) && (
          <div className="text-xs">
            {label && (
              <label
                htmlFor={checkboxId}
                className={`font-medium block cursor-pointer leading-tight ${
                    disabled
                      ? 'text-slate-500 dark:text-slate-500 cursor-not-allowed'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-slate-400 dark:text-slate-400 mt-0.5 text-[11px] leading-normal">{description}</p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
