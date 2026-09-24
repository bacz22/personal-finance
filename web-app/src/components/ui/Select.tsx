import React, { useState, useRef, useId } from 'react'
import { ChevronDown, Check, AlertCircle, Search } from 'lucide-react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/utils/cn'

export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
  icon?: React.ReactNode
  description?: string
}

export interface SelectProps {
  label?: string
  helperText?: string
  error?: string
  options: SelectOption[]
  value?: string | number
  defaultValue?: string | number
  onChange?: (value: string | number) => void
  placeholder?: string
  fullWidth?: boolean
  disabled?: boolean
  required?: boolean
  searchable?: boolean
  className?: string
  id?: string
  name?: string
}

export const Select: React.FC<SelectProps> = ({
  label,
  helperText,
  error,
  options = [],
  value,
  defaultValue,
  onChange,
  placeholder = '-- Chọn một tùy chọn --',
  fullWidth = true,
  disabled = false,
  required = false,
  searchable = false,
  className = '',
  id,
  name,
}) => {
  const generatedId = useId()
  const selectId = id || generatedId
  const errorId = `${selectId}-error`
  const helperId = `${selectId}-helper`

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Determine internal selected value (controlled vs uncontrolled)
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState<string | number>(() => {
    if (defaultValue !== undefined) return defaultValue
    if (options.length > 0 && !placeholder) return options[0].value
    return ''
  })

  const currentValue = isControlled ? value : internalValue
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleOpenChange = (open: boolean) => {
    if (disabled) return
    setIsOpen(open)
    if (!open) {
      setSearchQuery('')
    }
  }

  // Find selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(currentValue))

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return
    if (!isControlled) {
      setInternalValue(opt.value)
    }
    onChange?.(opt.value)
    setIsOpen(false)
    setSearchQuery('')
  }

  // Filtered options if searching
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const showSearch = searchable || options.length > 8

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} select-none`}>
      {/* Hidden input for HTML form submission */}
      {name && <input type="hidden" name={name} value={currentValue} />}

      {/* Real Label */}
      {label && (
        <label
          htmlFor={selectId}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5 cursor-pointer select-none"
        >
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}

      {/* Popover Primitive Root */}
      <PopoverPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverPrimitive.Trigger asChild disabled={disabled}>
          <button
            id={selectId}
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              'w-full text-sm rounded-2xl transition-all duration-200 flex items-center justify-between text-left py-2.5 px-3.5 border focus:outline-none backdrop-blur-[var(--glass-blur,16px)]',
              disabled
                ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700/50 cursor-not-allowed select-none'
                : isOpen
                ? 'border-emerald-500 dark:border-emerald-400 ring-4 ring-emerald-500/15 bg-white dark:bg-slate-900 shadow-[0_0_16px_rgba(16,185,129,0.18),inset_0_1px_1px_rgba(255,255,255,0.9)] cursor-pointer'
                : error
                ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500 text-rose-900 dark:text-rose-200 bg-rose-50/50 dark:bg-rose-950/30 cursor-pointer shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.9)]'
                : 'border-slate-300 dark:border-white/20 hover:border-slate-400 dark:hover:border-white/30 bg-white/85 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-900/95 text-slate-900 dark:text-slate-100 shadow-[0_1px_2px_rgba(15,23,42,0.05),inset_0_1px_1.5px_rgba(255,255,255,0.95)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] cursor-pointer',
              className
            )}
          >
            <div className="flex items-center gap-2.5 min-w-0 truncate">
              {selectedOption?.icon && (
                <span className={`shrink-0 ${disabled ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  {selectedOption.icon}
                </span>
              )}
              <span
                className={`truncate ${
                  disabled
                    ? 'text-slate-500'
                    : selectedOption
                    ? 'text-slate-900 dark:text-white font-medium'
                    : 'text-slate-400'
                }`}
              >
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
              }`}
            />
          </button>
        </PopoverPrimitive.Trigger>

        {/* Portalled Dropdown Content — Rendered at body level to prevent clipping */}
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={6}
            collisionPadding={12}
            onOpenAutoFocus={(e) => {
              if (showSearch) {
                e.preventDefault()
                setTimeout(() => searchInputRef.current?.focus(), 50)
              }
            }}
            className="z-50 bg-[var(--glass-surface,rgba(255,255,255,0.88))] dark:bg-slate-900/90 backdrop-blur-[var(--glass-blur,24px)] rounded-3xl border border-white/90 dark:border-slate-700/60 shadow-[0_20px_60px_rgba(15,23,42,0.12),0_4px_20px_rgba(0,0,0,0.04)] p-2 animate-in fade-in-0 zoom-in-95 duration-150 text-slate-900 dark:text-white focus:outline-none"
            style={{
              width: 'var(--radix-popover-trigger-width)',
              minWidth: 'min(100vw - 32px, 240px)',
              maxWidth: 'calc(100vw - 24px)',
            }}
          >
            {/* Optional Search Bar */}
            {showSearch && (
              <div className="p-1.5 pb-2 border-b border-white/60 dark:border-slate-800/60 mb-1.5">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm kiếm danh mục..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-[var(--glass-surface,rgba(255,255,255,0.72))] dark:bg-slate-800/75 backdrop-blur-[var(--glass-blur,16px)] border border-white/80 dark:border-slate-700/60 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20 focus:bg-[var(--glass-surface,rgba(255,255,255,0.88))] dark:focus:bg-slate-800/88 shadow-2xs transition-all"
                  />
                </div>
              </div>
            )}

            {/* Options List */}
            <div
              role="listbox"
              className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar p-0.5"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  Không tìm thấy kết quả phù hợp
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(currentValue)

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-sm transition-all cursor-pointer select-none ${
                        opt.disabled
                          ? 'opacity-40 cursor-not-allowed bg-transparent'
                          : isSelected
                          ? 'bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-semibold shadow-2xs backdrop-blur-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white border border-transparent hover:border-white/80 dark:hover:border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {opt.icon && (
                          <span className="shrink-0 text-slate-500 dark:text-slate-400">{opt.icon}</span>
                        )}
                        <div>
                          <span className="block truncate">{opt.label}</span>
                          {opt.description && (
                            <span className="block text-[11px] text-slate-400 font-normal mt-0.5">
                              {opt.description}
                            </span>
                          )}
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.25]" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {/* Error / Helper text */}
      {error ? (
        <p
          id={errorId}
          className="text-xs text-rose-600 flex items-center gap-1.5 font-medium mt-1 animate-in fade-in duration-150"
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
