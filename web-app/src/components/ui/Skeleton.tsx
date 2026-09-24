import React from 'react'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  width?: string | number
  height?: string | number
}

/**
 * Base Skeleton component with light shimmer and prefers-reduced-motion support
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  width,
  height,
  className = '',
  style,
  ...props
}) => {
  const variantStyles = {
    text: 'h-4 w-full rounded-md',
    circular: 'rounded-full shrink-0',
    rectangular: 'rounded-none w-full',
    rounded: 'rounded-2xl w-full',
  }

  const customStyle: React.CSSProperties = {
    ...style,
    width: width !== undefined ? width : style?.width,
    height: height !== undefined ? height : style?.height,
  }

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse motion-reduce:animate-none bg-slate-200/50 backdrop-blur-xs select-none ${variantStyles[variant]} ${className}`}
      style={customStyle}
      {...props}
    />
  )
}

/**
 * Skeleton cho từng KPI Card (Dashboard / Reports) — Glass Tier 2
 */
export const KPICardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      aria-hidden="true"
      className={`bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200 p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <Skeleton variant="text" className="w-28 h-4" />
        <Skeleton variant="rounded" className="w-10 h-10 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" className="w-36 h-8" />
        <Skeleton variant="text" className="w-24 h-3.5" />
      </div>
      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
        <Skeleton variant="text" className="w-20 h-4" />
        <Skeleton variant="text" className="w-16 h-4" />
      </div>
    </div>
  )
}

/**
 * Skeleton cho vùng Biểu đồ Dashboard (Category Donut & Daily Bar Chart)
 */
export const DashboardChartsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" aria-hidden="true">
      {/* Donut Chart Skeleton */}
      <div className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-36 h-5" />
          <Skeleton variant="rounded" className="w-8 h-8 rounded-xl" />
        </div>
        <div className="py-6 flex items-center justify-center">
          <Skeleton variant="circular" className="w-48 h-48" />
        </div>
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <Skeleton variant="text" className="w-full h-4" />
          <Skeleton variant="text" className="w-4/5 h-4" />
          <Skeleton variant="text" className="w-2/3 h-4" />
        </div>
      </div>

      {/* Bar Chart Skeleton */}
      <div className="lg:col-span-2 bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton variant="text" className="w-44 h-5" />
            <Skeleton variant="text" className="w-64 h-3.5" />
          </div>
          <Skeleton variant="rounded" className="w-24 h-8 rounded-xl" />
        </div>
        <div className="h-64 sm:h-72 flex items-end gap-2 pt-8 pb-2 px-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center h-full">
              <Skeleton
                variant="rounded"
                className="w-full rounded-t-sm"
                style={{ height: `${20 + ((i * 19) % 75)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="pt-2 border-t border-slate-200 flex justify-between">
          <Skeleton variant="text" className="w-28 h-4" />
          <Skeleton variant="text" className="w-32 h-4" />
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton cho bảng giao dịch (Transactions Table Skeleton Rows)
 */
export const TransactionTableSkeleton: React.FC<{ rowsCount?: number }> = ({
  rowsCount = 6,
}) => {
  return (
    <div aria-hidden="true" className="space-y-4">
      {/* Desktop view */}
      <div className="hidden md:block bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-white/80 dark:border-slate-700/60 overflow-hidden shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="p-4 border-b border-white/60 dark:border-slate-800/60 flex items-center justify-between bg-white/30 dark:bg-slate-800/30">
          <Skeleton variant="text" className="w-32 h-4" />
          <Skeleton variant="text" className="w-48 h-4" />
        </div>
        <div className="divide-y divide-white/60 dark:divide-slate-800/60">
          {Array.from({ length: rowsCount }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <Skeleton variant="text" className="w-20 h-4" />
              <div className="flex items-center gap-3 flex-1 max-w-xs">
                <Skeleton variant="rounded" className="w-9 h-9 rounded-xl shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="text" className="w-32 h-4" />
                  <Skeleton variant="text" className="w-20 h-3" />
                </div>
              </div>
              <Skeleton variant="rounded" className="w-24 h-6 rounded-full" />
              <Skeleton variant="text" className="w-24 h-4" />
              <Skeleton variant="text" className="w-28 h-5 ml-auto" />
              <div className="flex gap-2">
                <Skeleton variant="rounded" className="w-7 h-7 rounded-lg" />
                <Skeleton variant="rounded" className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-4 bg-[var(--glass-surface,rgba(255,255,255,0.82))] dark:bg-slate-900/85 backdrop-blur-md rounded-3xl border border-white/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(15,23,42,0.04)] space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton variant="rounded" className="w-9 h-9 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton variant="text" className="w-28 h-4" />
                  <Skeleton variant="text" className="w-16 h-3" />
                </div>
              </div>
              <Skeleton variant="text" className="w-20 h-5" />
            </div>
            <div className="pt-2 border-t border-white/60 dark:border-slate-800/60 flex items-center justify-between">
              <Skeleton variant="rounded" className="w-20 h-5 rounded-full" />
              <Skeleton variant="text" className="w-24 h-3.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton cho Card Tổng Quan Ngân Sách
 */
export const BudgetOverviewSkeleton: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" className="w-11 h-11 rounded-2xl" />
          <div className="space-y-1.5">
            <Skeleton variant="text" className="w-48 h-5" />
            <Skeleton variant="text" className="w-64 h-3.5" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rounded" className="w-20 h-7 rounded-lg" />
          <Skeleton variant="rounded" className="w-20 h-7 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Skeleton variant="rounded" className="h-20 rounded-xl" />
        <Skeleton variant="rounded" className="h-20 rounded-xl" />
        <Skeleton variant="rounded" className="h-20 rounded-xl" />
      </div>
      <Skeleton variant="rounded" className="w-full h-3 rounded-full" />
    </div>
  )
}

/**
 * Skeleton cho Card Ngân Sách Danh Mục — Glass Tier 1
 */
export const BudgetCardSkeleton: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="bg-white/90 backdrop-blur-md rounded-[28px] border border-slate-200 p-5 shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton variant="rounded" className="w-10 h-10 rounded-xl" />
          <div className="space-y-1">
            <Skeleton variant="text" className="w-28 h-4" />
            <Skeleton variant="text" className="w-20 h-3" />
          </div>
        </div>
        <Skeleton variant="rounded" className="w-20 h-6 rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton variant="text" className="w-24 h-4" />
          <Skeleton variant="text" className="w-28 h-4" />
        </div>
        <Skeleton variant="rounded" className="w-full h-2.5 rounded-full" />
      </div>
      <div className="pt-2 border-t border-slate-200 flex justify-between">
        <Skeleton variant="text" className="w-24 h-3.5" />
        <Skeleton variant="text" className="w-20 h-3.5" />
      </div>
    </div>
  )
}

/**
 * Skeleton cho Báo Cáo Summary (3 KPI Cards)
 */
export const ReportsSummarySkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6" aria-hidden="true">
      <KPICardSkeleton />
      <KPICardSkeleton />
      <KPICardSkeleton />
    </div>
  )
}

/**
 * Skeleton cho Báo Cáo Grouped Bar Chart
 */
export const ReportsChartSkeleton: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="bg-white/90 backdrop-blur-xl rounded-[28px] border border-slate-200 p-5 sm:p-6 shadow-[0_4px_20px_rgba(15,23,42,0.06)] space-y-5"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <Skeleton variant="text" className="w-56 h-5" />
          <Skeleton variant="text" className="w-72 h-3.5" />
        </div>
        <Skeleton variant="rounded" className="w-32 h-8 rounded-lg" />
      </div>
      <div className="flex gap-6 pb-2">
        <Skeleton variant="text" className="w-32 h-4" />
        <Skeleton variant="text" className="w-32 h-4" />
      </div>
      <div className="h-64 sm:h-80 flex items-end gap-4 pt-6 px-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex items-end justify-center gap-1.5 h-full">
            <Skeleton
              variant="rounded"
              className="w-1/2 rounded-t-sm"
              style={{ height: `${30 + ((i * 17) % 65)}%` }}
            />
            <Skeleton
              variant="rounded"
              className="w-1/2 rounded-t-sm"
              style={{ height: `${20 + ((i * 23) % 75)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
        <Skeleton variant="text" className="w-48 h-4" />
        <Skeleton variant="text" className="w-24 h-4" />
      </div>
    </div>
  )
}
