import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Wallet,
  User,
  Mail,
  Lock,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  Check,
} from 'lucide-react'
import { Button, Input, useToast } from '../components/ui'
import { ApiError } from '../api'
import { useAuth } from '../AuthContext'
import { ColdStartNotice } from '../components/ui/ColdStartNotice'

export const RegisterPage: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<{
    fullName?: string
    email?: string
    password?: string
    confirmPassword?: string
    general?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)


  // Password strength checks (clean, minimal)
  const hasMinLength = password.length >= 8
  const hasNumber = /\d/.test(password)

  // Validate form fields
  const validate = (): boolean => {
    const newErrors: {
      fullName?: string
      email?: string
      password?: string
      confirmPassword?: string
      general?: string
    } = {}

    // Name validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên của bạn'
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Họ và tên quá ngắn'
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = 'Vui lòng nhập địa chỉ email'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email.trim())) {
        newErrors.email = 'Địa chỉ email không đúng định dạng (Ví dụ: name@example.com)'
      }
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (!hasMinLength) {
      newErrors.password = 'Mật khẩu phải có tối thiểu 8 ký tự'
    } else if (!hasNumber) {
      newErrors.password = 'Mật khẩu cần chứa ít nhất một chữ số (0-9)'
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu'
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp'
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
      const response = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      })
      toast.success('Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.', { title: 'Đăng ký' })
      navigate('/login', { replace: true, state: { email: response.email } })
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        const fieldErrors = Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message]))
        setErrors({
          fullName: fieldErrors.fullName,
          email: fieldErrors.email,
          password: fieldErrors.password,
          confirmPassword: fieldErrors.confirmPassword || fieldErrors.passwordMatching,
          general: error.fieldErrors.some(({ field }) => field === 'passwordMatching') ? undefined : error.message,
        })
      } else {
        setErrors({
          general: error instanceof ApiError && error.errorCode === 'REQUEST_TIMEOUT'
            ? 'Chưa nhận được xác nhận sau 90 giây; tài khoản có thể đã được tạo. Hãy thử đăng nhập trước khi gửi lại yêu cầu đăng ký.'
            : error instanceof Error ? error.message : 'Tạo tài khoản không thành công.',
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

        {/* Heading */}
        <h1 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Tạo tài khoản mới
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
          Bắt đầu kiểm soát tài chính cá nhân thông minh, dễ dàng và hoàn toàn miễn phí.
        </p>
      </div>

      {/* Main Register Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl py-8 px-6 sm:px-8 rounded-3xl border border-white/85 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] relative overflow-hidden">
          {errors.general && (
            <div className="mb-5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <Input
              id="register-fullname"
              type="text"
              label="Họ và tên"
              required
              placeholder="Nguyễn Văn A"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value)
                if (errors.fullName) setErrors({ ...errors, fullName: undefined })
              }}
              error={errors.fullName}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              autoFocus
              disabled={isSubmitting}
            />

            {/* Email Address */}
            <Input
              id="register-email"
              type="email"
              label="Địa chỉ Email"
              required
              placeholder="tenban@vi-du.vn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors({ ...errors, email: undefined })
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              disabled={isSubmitting}
            />

            {/* Password Field */}
            <div className="space-y-1.5">
              <Input
                id="register-password"
                type="password"
                label="Mật khẩu"
                required
                placeholder="Tối thiểu 8 ký tự"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({ ...errors, password: undefined })
                }}
                error={errors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                autoComplete="new-password"
                disabled={isSubmitting}
              />

              {/* Minimal Password Requirements Guide (Không làm rối giao diện) */}
              <div className="pt-1 px-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                <div
                  className={`flex items-center gap-1 transition-colors ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Ít nhất 8 ký tự</span>
                </div>

                <div
                  className={`flex items-center gap-1 transition-colors ${hasNumber ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${hasNumber ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                  <span>Chứa chữ số (0-9)</span>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <Input
              id="register-confirm-password"
              type="password"
              label="Xác nhận mật khẩu"
              required
              placeholder="Nhập lại mật khẩu vừa tạo"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
              }}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
              autoComplete="new-password"
              disabled={isSubmitting}
            />

            {/* Primary Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText="Đang tạo tài khoản..."
                leftIcon={<UserPlus className="w-4 h-4" />}
              >
                Tạo tài khoản
              </Button>
            </div>
          </form>
          <ColdStartNotice key={isSubmitting ? 'submitting' : 'idle'} active={isSubmitting} />

          {/* Link back to Login */}
          <div className="mt-6 pt-6 border-t border-white/60 dark:border-white/10 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đã có tài khoản?{' '}
              <Link
                to="/login"
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline ml-1"
              >
                Đăng nhập ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4 text-slate-400 dark:text-slate-400" />
          <span>Thông tin tài khoản được bảo vệ tuyệt đối</span>
        </div>
      </div>
    </div>
  )
}
