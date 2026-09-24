import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Wallet,
  Mail,
  Lock,
  LogIn,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { Button, Input, Checkbox } from '../components/ui'
import { ApiError } from '../api'
import { useAuth } from '../AuthContext'
import { PASSWORD_RECOVERY_ENABLED } from '../config'
import { ColdStartNotice } from '../components/ui/ColdStartNotice'

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as { from?: string; email?: string } | null
  const redirectTo = routeState?.from || '/dashboard'
  const [email, setEmail] = useState(routeState?.email || '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validation errors
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  // Validate form fields
  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string; general?: string } = {}

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email của bạn'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Địa chỉ email không đúng định dạng (Ví dụ: name@example.com)'
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu đăng nhập'
    } else if (password.length < 6) {
      newErrors.password = 'Mật khẩu phải có độ dài tối thiểu từ 6 ký tự trở lên'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)
    setErrors({})
    try {
      const currentUser = await login({ email: email.trim(), password, rememberMe })
      navigate(currentUser.mustChangePassword ? '/change-password' : redirectTo, { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        const fieldErrors = Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message]))
        setErrors({
          email: fieldErrors.email,
          password: fieldErrors.password,
          general: error.message,
        })
      } else {
        setErrors({
          general: error instanceof ApiError && error.errorCode === 'REQUEST_TIMEOUT'
            ? 'Máy chủ phản hồi quá lâu. Yêu cầu không được tự gửi lại; bạn có thể chờ thêm hoặc bấm đăng nhập lại.'
            : error instanceof Error ? error.message : 'Đăng nhập không thành công.',
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* App Logo */}
        <Link
          to="/"
          className="inline-flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-2xl p-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.35),inset_0_1px_2px_rgba(255,255,255,0.4)] border-t border-white/40 group-hover:scale-105 transition-all">
            <Wallet className="w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="font-black text-xl tracking-tight text-slate-900 dark:text-white block leading-none">
              Ghi chú chi tiêu
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 block">
              Quản lý tài chính cá nhân
            </span>
          </div>
        </Link>

        {/* Title & Description */}
        <h1 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Chào mừng bạn quay lại
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
          Đăng nhập vào tài khoản để tiếp tục theo dõi chi tiêu và kế hoạch ngân sách của bạn.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl py-8 px-6 sm:px-8 rounded-3xl border border-white/85 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] relative overflow-hidden">
          {/* General Error banner if any */}
          {errors.general && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <Input
              id="login-email"
              type="email"
              label="Địa chỉ Email"
              required
              placeholder="tenban@vi-du.vn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email || errors.general) setErrors({ ...errors, email: undefined, general: undefined })
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              autoFocus
              disabled={isSubmitting}
            />

            {/* Password Field */}
            <Input
              id="login-password"
              type="password"
              label="Mật khẩu"
              required
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                if (errors.password) setErrors({ ...errors, password: undefined })
              }}
              error={errors.password}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="current-password"
              disabled={isSubmitting}
            />

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <Checkbox
                id="remember-me"
                label="Ghi nhớ đăng nhập"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isSubmitting}
              />

              {PASSWORD_RECOVERY_ENABLED && (
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors focus:outline-none"
                >
                  Quên mật khẩu?
                </Link>
              )}
            </div>

            {!PASSWORD_RECOVERY_ENABLED && (
              <p role="status" className="rounded-xl bg-slate-100/80 p-2.5 text-xs leading-relaxed text-slate-600 dark:bg-slate-800/80 dark:text-slate-300">
                Khôi phục mật khẩu đang tạm tắt trong bản demo. Vui lòng liên hệ quản trị viên để được hỗ trợ.
              </p>
            )}

            {/* Primary Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isSubmitting}
                loadingText="Đang đăng nhập..."
                leftIcon={<LogIn className="w-4 h-4" />}
              >
                Đăng nhập
              </Button>
            </div>
          </form>
          <ColdStartNotice key={isSubmitting ? 'submitting' : 'idle'} active={isSubmitting} />

          {/* Divider */}
          <div className="mt-6 pt-6 border-t border-white/60 dark:border-white/10 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline ml-1"
              >
                Tạo tài khoản mới
              </Link>
            </p>
          </div>
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-400" />
          <span>Dữ liệu được bảo mật chuẩn mã hóa an toàn</span>
        </div>
      </div>
    </div>
  )
}
