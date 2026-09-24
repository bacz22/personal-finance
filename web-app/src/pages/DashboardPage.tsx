import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Receipt,
  Plus,
  PieChart,
  TrendingUp,
  BarChart3,
} from 'lucide-react'
import {
  DashboardHeader,
  DashboardKPICards,
  CategoryExpenseChart,
  DailyExpenseTrend,
  MonthlyComparisonCard,
  RecentTransactions,
} from '../components/dashboard'
import { dashboardApi, type DashboardData } from '../components/dashboard/api'
import { Button, DashboardChartsSkeleton, DataLoadError, Tabs } from '../components/ui'

interface DashboardLoadError {
  monthKey: string
  message: string
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [retryCount, setRetryCount] = useState(0)
  const [loadedDashboard, setLoadedDashboard] = useState<{
    monthKey: string
    data: DashboardData
  } | null>(null)
  const [loadError, setLoadError] = useState<DashboardLoadError | null>(null)
  const [mobileChartTab, setMobileChartTab] = useState<'category' | 'trend' | 'comparison'>('category')
  const requestSequence = useRef(0)

  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
  const dashboard = loadedDashboard?.monthKey === monthKey ? loadedDashboard.data : null
  const errorMessage = loadError?.monthKey === monthKey ? loadError.message : null
  const isLoading = dashboard === null && errorMessage === null
  const hasNoTransactions = dashboard !== null && dashboard.transactionCount === 0

  useEffect(() => {
    let isCurrent = true
    const sequence = ++requestSequence.current

    dashboardApi.get(currentMonth, currentYear)
      .then((data) => {
        if (!isCurrent || sequence !== requestSequence.current) return
        setLoadedDashboard({ monthKey, data })
        setLoadError(null)
      })
      .catch((error: unknown) => {
        if (!isCurrent || sequence !== requestSequence.current) return
        setLoadError({
          monthKey,
          message: error instanceof Error ? error.message : 'Không thể tải dữ liệu Dashboard.',
        })
      })

    return () => {
      isCurrent = false
    }
  }, [currentMonth, currentYear, monthKey, retryCount])

  const handleDateChange = (month: number, year: number) => {
    setCurrentMonth(month)
    setCurrentYear(year)
  }

  const goToTransactions = () => navigate('/transactions')
  const handleRetry = () => {
    setLoadError(null)
    setRetryCount((count) => count + 1)
  }

  const chartContent = dashboard && (
    <>
      <div className="hidden lg:block order-2 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CategoryExpenseChart
            currentMonth={currentMonth}
            currentYear={currentYear}
            data={dashboard.categoryBreakdown}
            totalExpense={dashboard.expense}
            onAddTransaction={goToTransactions}
          />
          <DailyExpenseTrend
            currentMonth={currentMonth}
            currentYear={currentYear}
            data={dashboard.dailyExpenses}
            className="lg:col-span-2"
            onAddTransaction={goToTransactions}
          />
        </div>
        <MonthlyComparisonCard
          currentMonth={currentMonth}
          currentYear={currentYear}
          currentExpense={dashboard.expense}
          previousExpense={dashboard.previousMonthExpense}
        />
      </div>

      <div className="lg:hidden order-3 space-y-4">
        <div className="bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Báo cáo &amp; Phân tích
              </h3>
            </div>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Chạm tab để đổi biểu đồ
            </span>
          </div>
          <Tabs
            value={mobileChartTab}
            onChange={setMobileChartTab}
            fullWidth
            size="sm"
            tabs={[
              {
                id: 'category',
                label: 'Cơ cấu',
                icon: <PieChart className="w-3.5 h-3.5 shrink-0" />,
                activeColor: 'emerald',
              },
              {
                id: 'trend',
                label: 'Xu hướng',
                icon: <TrendingUp className="w-3.5 h-3.5 shrink-0" />,
                activeColor: 'rose',
              },
              {
                id: 'comparison',
                label: 'So sánh',
                icon: <BarChart3 className="w-3.5 h-3.5 shrink-0" />,
                activeColor: 'blue',
              },
            ]}
          />
        </div>

        <div key={mobileChartTab} className="animate-in fade-in zoom-in-[0.98] duration-200">
          {mobileChartTab === 'category' && (
            <CategoryExpenseChart
              currentMonth={currentMonth}
              currentYear={currentYear}
              data={dashboard.categoryBreakdown}
              totalExpense={dashboard.expense}
              onAddTransaction={goToTransactions}
            />
          )}
          {mobileChartTab === 'trend' && (
            <DailyExpenseTrend
              currentMonth={currentMonth}
              currentYear={currentYear}
              data={dashboard.dailyExpenses}
              onAddTransaction={goToTransactions}
            />
          )}
          {mobileChartTab === 'comparison' && (
            <MonthlyComparisonCard
              currentMonth={currentMonth}
              currentYear={currentYear}
              currentExpense={dashboard.expense}
              previousExpense={dashboard.previousMonthExpense}
            />
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        onDateChange={handleDateChange}
      />

      {isLoading ? (
        <div className="space-y-6">
          <DashboardKPICards isLoading currentMonth={currentMonth} currentYear={currentYear} />
          <DashboardChartsSkeleton />
        </div>
      ) : errorMessage ? (
        <DataLoadError
          variant="full"
          title="Không thể tải Dashboard"
          message={errorMessage}
          onRetry={handleRetry}
        />
      ) : dashboard ? (
        <div className="flex flex-col gap-6">
          <div
            className={`hidden md:flex p-4 rounded-2xl border flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs ${
              hasNoTransactions
                ? 'bg-amber-50/70 border-amber-200/80 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200'
                : 'bg-emerald-50/70 border-emerald-200/80 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles
                className={`w-4 h-4 shrink-0 ${hasNoTransactions ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}
              />
              <span>
                {hasNoTransactions ? (
                  <>
                    Kỳ <strong>Tháng {String(currentMonth).padStart(2, '0')}/{currentYear}</strong> hiện chưa có giao dịch nào được ghi nhận.
                  </>
                ) : (
                  <>
                    Đang lọc dữ liệu tài chính cho <strong>Tháng {String(currentMonth).padStart(2, '0')}/{currentYear}</strong>. Các chỉ số và biểu đồ được cập nhật theo kỳ này.
                  </>
                )}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-lg bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] border shadow-2xs shrink-0 self-start sm:self-auto ${
                hasNoTransactions
                  ? 'text-amber-700 border-amber-200/60 dark:text-amber-300 dark:border-amber-800'
                  : 'text-emerald-700 border-emerald-200/60 dark:text-emerald-300 dark:border-emerald-800'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${hasNoTransactions ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
              {hasNoTransactions ? 'Chưa có dữ liệu' : 'Kỳ báo cáo hoạt động'}
            </span>
          </div>

          <DashboardKPICards
            currentMonth={currentMonth}
            currentYear={currentYear}
            income={dashboard.income}
            expense={dashboard.expense}
            balance={dashboard.balance}
            savingsRate={dashboard.savingsRate}
          />

          {hasNoTransactions ? (
            <div className="space-y-6">
              <div className="bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 sm:p-14 text-center shadow-xs flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4 ring-8 ring-slate-50 dark:ring-slate-900/50">
                  <Receipt className="w-8 h-8 stroke-[1.5]" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
                  Chưa có dữ liệu để phân tích
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                  Khi bạn thêm giao dịch cho tháng này, Dashboard sẽ tổng hợp thu chi và biểu đồ tại đây.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={goToTransactions}
                >
                  Mở giao dịch
                </Button>
              </div>
              {dashboard.previousMonthExpense > 0 && (
                <MonthlyComparisonCard
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  currentExpense={dashboard.expense}
                  previousExpense={dashboard.previousMonthExpense}
                />
              )}
            </div>
          ) : (
            <>
              <div className="order-2 lg:order-3">
                <RecentTransactions
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  transactions={dashboard.recentTransactions}
                  onAddTransaction={goToTransactions}
                />
              </div>
              {chartContent}
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
