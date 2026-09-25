import React, { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  PiggyBank,
  BarChart3,
  Tags,
  Settings,
  LogOut,
  UserRound,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../AuthContext'
import { useToast } from '../ui'
import { OfflineStatusBanner } from './OfflineStatusBanner'

interface NavItem {
  name: string
  to: string
  icon: React.ElementType
  isAvatar?: boolean
}

const navItems: NavItem[] = [
  { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { name: 'Giao dịch', to: '/transactions', icon: ReceiptText },
  { name: 'Ngân sách', to: '/budgets', icon: PiggyBank },
  { name: 'Báo cáo', to: '/reports', icon: BarChart3 },
  { name: 'Danh mục', to: '/categories', icon: Tags },
  { name: 'Cài đặt', to: '/settings', icon: Settings, isAvatar: true },
]

export const AppLayout: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const toast = useToast()

  const initials = user?.fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0].toUpperCase())
    .join('')

  const handleLogout = async () => {
    let cancelled = false
    try {
      await logout()
      toast.success('Đã đăng xuất.')
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Đã hủy đăng xuất')) {
        cancelled = true
        toast.warning('Đã giữ lại các thay đổi chưa đồng bộ.')
        return
      }
      toast.warning('Đã đăng xuất khỏi giao diện, nhưng backend chưa xác nhận thu hồi phiên.')
    } finally {
      if (!cancelled) navigate('/login', { replace: true })
    }
  }

  // Active index for animated sliding pill navigation
  const getActiveIndex = () => {
    const currentPath = location.pathname
    if (currentPath === '/' || currentPath === '/dashboard') return 0
    const idx = navItems.findIndex(
      (item) => item.to !== '/dashboard' && currentPath.startsWith(item.to)
    )
    return idx !== -1 ? idx : 0
  }
  const activeIndex = getActiveIndex()

  // Tự động cuộn lên đầu trang mượt mà khi chuyển menu
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  return (
    <>
      <div className="min-h-screen text-slate-900 flex flex-col md:flex-row font-sans bg-transparent">
        {/* ========================================================================= */}
        {/* 1. DESKTOP & TABLET SIDEBAR — Floating Liquid Glass Sidebar */}
        {/* ========================================================================= */}
        <aside
          className={`hidden md:flex flex-col bg-[var(--glass-surface,rgba(255,255,255,0.85))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)] transition-all duration-200 z-30 sticky top-3 my-3 ml-3 h-[calc(100vh-24px)] rounded-[28px] shrink-0 ${
            isCollapsed ? 'w-20' : 'w-20 lg:w-64'
          }`}
        >
          {/* Sidebar Header: Logo & App Name */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/92 backdrop-blur-sm text-white flex items-center justify-center shrink-0 border-t border-white/30 shadow-[0_4px_16px_rgba(5,150,105,0.35)]">
                <Wallet className="w-5 h-5" />
              </div>
              <div
                className={`transition-opacity duration-200 ${
                  isCollapsed ? 'hidden' : 'hidden lg:block'
                }`}
              >
                <span className="font-bold text-base tracking-tight text-slate-900 block leading-tight">
                  Ghi chú chi tiêu
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Quản lý tài chính
                </span>
              </div>
            </div>

            {/* Toggle button on Desktop */}
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-white/60 hover:backdrop-blur-sm transition-colors cursor-pointer"
              title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
              aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation Menu Links */}
          <nav
            className="relative flex-1 px-3 py-3 space-y-1 overflow-y-auto custom-scrollbar select-none"
            aria-label="Điều hướng chính"
          >
            {/* Animated Sliding Pill Background cho Laptop/Desktop Sidebar */}
            {activeIndex >= 0 && (
              <div
                aria-hidden="true"
                className="absolute left-3 right-3 h-11 rounded-2xl bg-white shadow-sm border border-slate-200/90 transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none z-0"
                style={{
                  top: '12px',
                  transform: `translateY(${activeIndex * 48}px)`,
                }}
              >
                {/* Thanh chỉ báo màu xanh emerald ở mép trái */}
                {/* <span
                  className={`absolute left-1.5 top-2.5 bottom-2.5 w-1 rounded-full bg-emerald-600 shadow-xs transition-opacity duration-200 ${
                    isCollapsed ? 'opacity-0' : 'opacity-100 hidden lg:block'
                  }`}
                /> */}
              </div>
            )}

            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = index === activeIndex

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={item.name}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-10 group flex items-center gap-3 px-3.5 h-11 rounded-2xl text-sm font-semibold transition-colors duration-200 ${
                    isCollapsed ? 'justify-center' : 'justify-center lg:justify-start'
                  } ${
                    isActive
                      ? 'text-slate-900'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-all duration-200 ${
                      isActive
                        ? 'text-emerald-600 scale-105'
                        : 'text-slate-400 group-hover:text-slate-600 group-hover:scale-105'
                    }`}
                  />
                  <span
                    className={`transition-opacity duration-200 truncate ${
                      isCollapsed ? 'hidden' : 'hidden lg:inline'
                    }`}
                  >
                    {item.name}
                  </span>
                </NavLink>
              )
            })}
          </nav>

          {/* Sidebar Footer: User Profile & Logout Action */}
          <div className="p-3 border-t border-slate-200">
            <div
              className={`flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs ${
                isCollapsed ? 'justify-center' : 'justify-center lg:justify-between'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/16 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/20">
                  {initials || <UserRound className="w-4 h-4" />}
                </div>
                <div
                  className={`min-w-0 ${
                    isCollapsed ? 'hidden' : 'hidden lg:block'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    {user?.fullName || 'Tài khoản'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user?.email || 'Hồ sơ người dùng'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className={`p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer ${
                  isCollapsed ? 'hidden' : 'hidden lg:flex'
                }`}
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Logout action in collapsed tablet view */}
            <div
              className={`mt-2 flex justify-center ${
                isCollapsed ? 'flex' : 'flex lg:hidden'
              }`}
            >
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="p-2 rounded-full text-slate-400 hover:text-rose-600 hover:bg-white/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 cursor-pointer"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 2. MOBILE TOP BAR — Liquid Glass App Header */}
        {/* ========================================================================= */}
        <header className="md:hidden h-14 bg-[var(--glass-surface,rgba(255,255,255,0.9))] backdrop-blur-[var(--glass-blur,16px)] border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/92 backdrop-blur-sm text-white flex items-center justify-center border-t border-white/30 shadow-[0_2px_8px_rgba(5,150,105,0.35)]">
              <Wallet className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              Ghi chú chi tiêu
            </span>
          </div>

          <NavLink
            to="/settings"
            title="Tài khoản & Cài đặt"
            aria-label="Tài khoản & Cài đặt"
            className="w-8 h-8 rounded-full bg-emerald-500/16 text-emerald-800 font-bold text-xs flex items-center justify-center border border-emerald-500/20 active:scale-95 transition-transform"
          >
            {initials || <UserRound className="w-4 h-4" />}
          </NavLink>
        </header>

        {/* ========================================================================= */}
        {/* 3. MAIN CONTENT CONTAINER (Outlet) — Transparent to let fixed mesh gradient shine through */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent">
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-28 md:pb-8">
            <OfflineStatusBanner />
            <div
              key={location.pathname}
              className="animate-in fade-in duration-200 ease-out"
            >
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MOBILE FLOATING PILL NAVIGATION — Instagram / Threads Style Floating Island */}
      {/* ========================================================================= */}
      <nav
        className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-sm h-16 bg-[var(--glass-surface,rgba(255,255,255,0.92))] backdrop-blur-[var(--glass-blur,16px)] rounded-full border border-slate-200 dark:border-white/10 shadow-[0_12px_36px_rgba(15,23,42,0.2),0_2px_8px_rgba(15,23,42,0.08)] ring-1 ring-black/5 dark:ring-white/10 p-1.5 flex items-center select-none transition-all duration-200"
        aria-label="Điều hướng di động"
      >
        {/* Animated Sliding Pill Background — Full-size capsule with smooth transition like Image 1 */}
        {activeIndex >= 0 && (
          <div
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 rounded-full bg-slate-200/90 dark:bg-white/18 shadow-2xs transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-none"
            style={{
              width: `calc((100% - 12px) / ${navItems.length})`,
              left: '6px',
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        )}

        {navItems.map((item, index) => {
          const Icon = item.icon
          const isActive = index === activeIndex

          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={item.name}
              aria-label={item.name}
              aria-current={isActive ? 'page' : undefined}
              className={`relative z-10 flex-1 h-full min-h-11 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 select-none ${
                isActive
                  ? 'text-slate-950 dark:text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {item.isAvatar ? (
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/40 shadow-xs scale-105'
                      : 'bg-emerald-500/16 text-emerald-800 border border-emerald-500/25'
                  }`}
                >
                  {initials || <UserRound className="w-4 h-4" />}
                </div>
              ) : (
                <Icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
              )}
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
