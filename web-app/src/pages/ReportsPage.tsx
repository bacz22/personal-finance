import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeftRight,
  PieChart as PieChartIcon,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { ApiError } from '../api'
import { dashboardApi, type DashboardData } from '../components/dashboard/api'
import { DatePicker, Badge, Button, Card, Tabs } from '../components/ui'
import {
  type MonthSelection,
  calculateComparisonSummary,
  MonthlyComparisonSummary,
  MonthlyComparisonChart,
  MonthlyComparisonTable,
  EmptyReportState,
  CurrentMonthReport,
} from '../components/reports'
import { reportsApi, type MonthlyComparisonData } from '../components/reports/api'

export type ReportTab = 'current' | 'comparison'

function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) return error.message
  return 'Đã xảy ra lỗi khi tải báo cáo. Vui lòng thử lại.'
}

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('current')

  const now = new Date()
  const currentMonth = { month: now.getMonth() + 1, year: now.getFullYear() }
  const previousDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const [reportMonth, setReportMonth] = useState<MonthSelection>(currentMonth)
  const [monthA, setMonthA] = useState<MonthSelection>({
    month: previousDate.getMonth() + 1,
    year: previousDate.getFullYear(),
  })
  const [monthB, setMonthB] = useState<MonthSelection>(currentMonth)

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [dashboardRetry, setDashboardRetry] = useState(0)

  const [comparisonData, setComparisonData] = useState<MonthlyComparisonData | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [comparisonError, setComparisonError] = useState<string | null>(null)
  const [comparisonRetry, setComparisonRetry] = useState(0)

  const monthAMonth = monthA.month
  const monthAYear = monthA.year
  const monthBMonth = monthB.month
  const monthBYear = monthB.year

  const handleTabChange = (tab: ReportTab) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    if (tab === 'current') {
      setDashboardLoading(true)
      setDashboardError(null)
    } else {
      setComparisonLoading(true)
      setComparisonError(null)
    }
  }

  const handleReportMonthChange = (month: MonthSelection) => {
    if (month.month === reportMonth.month && month.year === reportMonth.year) return
    setReportMonth(month)
    setDashboardLoading(true)
    setDashboardError(null)
  }

  const handleComparisonMonthChange = (selection: 'A' | 'B', month: number, year: number) => {
    const currentSelection = selection === 'A' ? monthA : monthB
    if (currentSelection.month === month && currentSelection.year === year) return
    if (selection === 'A') setMonthA({ month, year })
    else setMonthB({ month, year })
    setComparisonLoading(true)
    setComparisonError(null)
  }

  const retryDashboard = () => {
    setDashboardLoading(true)
    setDashboardError(null)
    setDashboardRetry((retry) => retry + 1)
  }

  const retryComparison = () => {
    setComparisonLoading(true)
    setComparisonError(null)
    setComparisonRetry((retry) => retry + 1)
  }

  useEffect(() => {
    if (activeTab !== 'current') return
    let ignored = false

    dashboardApi.get(reportMonth.month, reportMonth.year)
      .then((data) => {
        if (!ignored) setDashboardData(data)
      })
      .catch((error: unknown) => {
        if (!ignored) setDashboardError(errorMessage(error))
      })
      .finally(() => {
        if (!ignored) setDashboardLoading(false)
      })

    return () => {
      ignored = true
    }
  }, [activeTab, reportMonth.month, reportMonth.year, dashboardRetry])

  useEffect(() => {
    if (activeTab !== 'comparison') return
    let ignored = false

    reportsApi.compareMonths(
      { month: monthAMonth, year: monthAYear },
      { month: monthBMonth, year: monthBYear },
    )
      .then((data) => {
        if (!ignored) setComparisonData(data)
      })
      .catch((error: unknown) => {
        if (!ignored) setComparisonError(errorMessage(error))
      })
      .finally(() => {
        if (!ignored) setComparisonLoading(false)
      })

    return () => {
      ignored = true
    }
  }, [activeTab, monthAMonth, monthAYear, monthBMonth, monthBYear, comparisonRetry])

  const comparisonRows = useMemo(() => comparisonData?.categoryBreakdown ?? [], [comparisonData])
  const summaryStats = useMemo(() => {
    if (!comparisonData) return null
    const categoryStats = calculateComparisonSummary(comparisonRows)
    return {
      ...categoryStats,
      totalMonthA: comparisonData.totalMonthA,
      totalMonthB: comparisonData.totalMonthB,
      diffAmount: comparisonData.diffAmount,
      percentChange: comparisonData.percentChange,
      isIncreased: comparisonData.diffAmount > 0,
      isDecreased: comparisonData.diffAmount < 0,
    }
  }, [comparisonData, comparisonRows])

  const handleSwapMonths = () => {
    if (monthA.month === monthB.month && monthA.year === monthB.year) return
    setMonthA(monthB)
    setMonthB(monthA)
    setComparisonLoading(true)
    setComparisonError(null)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-2xl lg:text-3xl dark:text-slate-100">
              Báo cáo chi tiêu
            </h1>
            <Badge
              variant={activeTab === 'current' ? 'info' : 'success'}
              size="sm"
              icon={<Sparkles className="h-3 w-3" />}
            >
              {activeTab === 'current' ? 'Tháng hiện tại' : 'Đối sánh 2 tháng'}
            </Badge>
          </div>
          <p className="mt-1 max-w-xl text-xs leading-normal text-slate-500 sm:text-sm dark:text-slate-400">
            {activeTab === 'current'
              ? 'Xem chi tiết số liệu, cơ cấu phân bổ danh mục và nhận định tài chính trong tháng.'
              : 'So sánh biến động chi tiêu giữa hai mốc thời gian để nhận diện xu hướng tài chính và tối ưu ngân sách.'}
          </p>
        </div>

        <Tabs<ReportTab>
          value={activeTab}
          onChange={handleTabChange}
          size="md"
          fullWidth
          containerClassName="w-full md:w-auto"
          tabs={[
            {
              id: 'current',
              label: 'Tháng hiện tại',
              icon: <PieChartIcon aria-hidden="true" className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
            },
            {
              id: 'comparison',
              label: 'Đối sánh 2 tháng',
              icon: <ArrowLeftRight aria-hidden="true" className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
            },
          ]}
        />
      </div>

      <div key={activeTab} className="animate-in fade-in zoom-in-[0.99] duration-200">
        {activeTab === 'current' && (
          <CurrentMonthReport
            initialMonth={currentMonth}
            month={reportMonth}
            onMonthChange={handleReportMonthChange}
            data={dashboardData?.categoryBreakdown}
            totalExpense={dashboardData?.expense}
            dailyExpenses={dashboardData?.dailyExpenses}
            isLoading={dashboardLoading || (!dashboardData && !dashboardError)}
            error={dashboardError}
            onRetry={retryDashboard}
          />
        )}

        {activeTab === 'comparison' && (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="w-full rounded-3xl border border-white/85 bg-[rgba(255,255,255,0.82)] p-2 shadow-[0_12px_32px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] backdrop-blur-2xl sm:w-auto sm:p-2.5 dark:border-white/10 dark:bg-[rgba(15,23,42,0.85)]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <DatePicker
                      mode="month"
                      variant="stepper"
                      month={monthA.month}
                      year={monthA.year}
                      onMonthChange={(month, year) => handleComparisonMonthChange('A', month, year)}
                      className="w-full justify-between border-blue-200/80 bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] dark:border-blue-900/60"
                    />
                  </div>

                  <div className="mb-0.5 flex items-center justify-center self-end">
                    <button
                      type="button"
                      onClick={handleSwapMonths}
                      className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border border-white/90 bg-white/70 text-slate-600 shadow-[0_2px_8px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,0.95)] backdrop-blur-md transition-all duration-200 hover:bg-white/95 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 active:scale-95 dark:border-white/20 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-700/90 dark:hover:text-emerald-400"
                      title="Đảo vị trí giữa Tháng A và Tháng B"
                      aria-label="Đảo vị trí hai tháng"
                    >
                      <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <DatePicker
                      mode="month"
                      variant="stepper"
                      month={monthB.month}
                      year={monthB.year}
                      onMonthChange={(month, year) => handleComparisonMonthChange('B', month, year)}
                      className="w-full justify-between border-emerald-200/80 bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] dark:border-emerald-900/60"
                    />
                  </div>
                </div>
              </div>
            </div>

            {comparisonError ? (
              <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50/90 p-5 dark:border-rose-900/60 dark:bg-rose-950/30">
                <div className="flex items-start gap-3">
                  <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-rose-900 dark:text-rose-200">Không tải được báo cáo so sánh</h2>
                    <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">{comparisonError}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={retryComparison}
                      leftIcon={<RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />}
                    >
                      Thử lại
                    </Button>
                  </div>
                </div>
              </div>
            ) : comparisonLoading || !summaryStats ? (
              <Card variant="default" className="flex min-h-56 items-center justify-center rounded-2xl p-8">
                <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <RefreshCw aria-hidden="true" className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                  Đang tải số liệu so sánh...
                </div>
              </Card>
            ) : summaryStats.totalMonthA === 0 && summaryStats.totalMonthB === 0 ? (
              <EmptyReportState monthA={monthA} monthB={monthB} />
            ) : (
              <>
                <MonthlyComparisonSummary
                  isLoading={false}
                  monthA={monthA}
                  monthB={monthB}
                  stats={summaryStats}
                  categoryCount={comparisonRows.length}
                />
                <MonthlyComparisonChart
                  isLoading={false}
                  monthA={monthA}
                  monthB={monthB}
                  data={comparisonRows}
                />
                <MonthlyComparisonTable
                  isLoading={false}
                  monthA={monthA}
                  monthB={monthB}
                  data={comparisonRows}
                  stats={summaryStats}
                />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
