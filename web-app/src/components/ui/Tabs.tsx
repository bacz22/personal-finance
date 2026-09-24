import React, { useRef, useState, useEffect, useLayoutEffect, useCallback } from 'react'

export interface TabItem<T extends string = string> {
  id: T
  label: React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  disabled?: boolean
  /** Màu sắc điểm nhấn khi kích hoạt (mặc định theo theme) */
  activeColor?: 'default' | 'emerald' | 'blue' | 'rose' | 'amber'
}

export interface TabsProps<T extends string = string> {
  tabs: TabItem<T>[]
  value: T
  onChange: (tabId: T) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'pill'
  fullWidth?: boolean
  className?: string
  containerClassName?: string
  'aria-label'?: string
}

const sizeStyles = {
  sm: {
    container: 'p-0.5 sm:p-1 rounded-xl',
    indicator: 'rounded-lg',
    tab: 'py-1 px-2 text-xs gap-1.5',
    icon: 'w-3.5 h-3.5',
  },
  md: {
    container: 'p-1 rounded-2xl',
    indicator: 'rounded-xl',
    tab: 'py-2 px-3 sm:px-4 text-xs sm:text-sm gap-2',
    icon: 'w-4 h-4',
  },
  lg: {
    container: 'p-1.5 rounded-2xl',
    indicator: 'rounded-xl',
    tab: 'py-2.5 px-4 sm:px-5 text-sm sm:text-base gap-2.5',
    icon: 'w-4.5 h-4.5',
  },
}

const activeColorStyles: Record<string, string> = {
  default: 'text-slate-900 dark:text-slate-100',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  blue: 'text-blue-600 dark:text-blue-400',
  rose: 'text-rose-600 dark:text-rose-400',
  amber: 'text-amber-600 dark:text-amber-400',
}

export const Tabs = <T extends string = string>({
  tabs,
  value,
  onChange,
  size = 'md',
  variant = 'default',
  fullWidth = false,
  className = '',
  containerClassName = '',
  'aria-label': ariaLabel = 'Điều hướng tab',
}: TabsProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  })
  const [isReady, setIsReady] = useState(false)

  const activeIndex = tabs.findIndex((t) => t.id === value)

  const updateIndicator = useCallback(() => {
    if (activeIndex === -1 || !tabRefs.current[activeIndex] || !containerRef.current) {
      return
    }

    const containerEl = containerRef.current
    const activeEl = tabRefs.current[activeIndex]

    if (activeEl) {
      const containerRect = containerEl.getBoundingClientRect()
      const activeRect = activeEl.getBoundingClientRect()

      setIndicatorStyle({
        left: activeRect.left - containerRect.left + containerEl.scrollLeft,
        width: activeRect.width,
        opacity: 1,
      })
      if (!isReady) setIsReady(true)
    }
  }, [activeIndex, isReady])

  // Cập nhật vị trí indicator khi value thay đổi
  useLayoutEffect(() => {
    updateIndicator()
  }, [updateIndicator])

  // Lắng nghe window resize & load font
  useEffect(() => {
    const handleResize = () => updateIndicator()
    window.addEventListener('resize', handleResize)
    const timeout = setTimeout(updateIndicator, 50)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [updateIndicator])

  const s = sizeStyles[size]

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      className={`relative inline-flex items-center select-none bg-slate-200/50 dark:bg-slate-800/60 border border-white/80 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] backdrop-blur-md ${
        s.container
      } ${fullWidth ? 'w-full flex' : 'w-auto'} ${containerClassName}`}
    >
      {/* 1. SLIDING ACTIVE PILL INDICATOR (HIỆU ỨNG TRƯỢT MƯỢT MÀ GPU ACCELERATED) */}
      <span
        aria-hidden="true"
        className={`absolute top-1 bottom-1 bg-white/95 dark:bg-slate-700/90 backdrop-blur-md shadow-xs border border-white/95 dark:border-slate-600/70 pointer-events-none transition-all duration-300 ${
          s.indicator
        } ${variant === 'pill' ? '!rounded-full' : ''}`}
        style={{
          left: `${indicatorStyle.left}px`,
          width: `${indicatorStyle.width}px`,
          opacity: indicatorStyle.opacity,
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />

      {/* 2. TAB BUTTONS */}
      {tabs.map((tab, idx) => {
        const isActive = tab.id === value
        const colorKey = tab.activeColor || 'default'
        const activeTextColor = activeColorStyles[colorKey] || activeColorStyles.default

        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[idx] = el
            }}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            type="button"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={`relative z-10 inline-flex items-center justify-center h-full font-semibold transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${
              s.tab
            } ${fullWidth ? 'flex-1' : 'flex-initial'} ${variant === 'pill' ? '!rounded-full' : ''} ${
              isActive
                ? `${activeTextColor} font-bold`
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            } ${className}`}
          >
            {tab.icon && (
              <span className={`shrink-0 transition-transform duration-200 ${isActive ? 'scale-105' : ''}`}>
                {tab.icon}
              </span>
            )}
            <span className="truncate">{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                    : 'bg-slate-300/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
