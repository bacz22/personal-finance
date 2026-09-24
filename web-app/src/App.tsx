import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { AuthProvider, useAuth } from './AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { BudgetsPage } from './pages/BudgetsPage'
import { ReportsPage } from './pages/ReportsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { SettingsPage } from './pages/SettingsPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ChangeTemporaryPasswordPage } from './pages/ChangeTemporaryPasswordPage'
import { PASSWORD_RECOVERY_ENABLED } from './config'
import { ColdStartNotice } from './components/ui/ColdStartNotice'

const RouteLoading: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center px-4 text-sm text-slate-500">
    <span>Đang kiểm tra phiên đăng nhập...</span>
    <div className="w-full max-w-sm"><ColdStartNotice /></div>
  </div>
)

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, isAuthenticated, user } = useAuth()
  const location = useLocation()
  if (isLoading) return <RouteLoading />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }
  if (!user?.mustChangePassword && location.pathname === '/change-password') {
    return <Navigate to="/dashboard" replace />
  }
  return <>{children}</>
}

const GuestOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading, isAuthenticated, user } = useAuth()
  if (isLoading) return <RouteLoading />
  return isAuthenticated
    ? <Navigate to={user?.mustChangePassword ? '/change-password' : '/dashboard'} replace />
    : <>{children}</>
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
          {/* Auth routes (độc lập, không có sidebar layout) */}
          <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
          <Route path="/forgot-password" element={PASSWORD_RECOVERY_ENABLED
            ? <GuestOnly><ForgotPasswordPage /></GuestOnly>
            : <Navigate to="/login" replace />} />
          <Route path="/change-password" element={<RequireAuth><ChangeTemporaryPasswordPage /></RequireAuth>} />

          {/* Layout dùng chung cho toàn bộ app với React Router Outlet */}
          <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budgets" element={<BudgetsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="settings" element={<SettingsPage />} />
            {/* Fallback cho route không tồn tại */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  )
}
