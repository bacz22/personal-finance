import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Mail, ArrowLeft, ShieldCheck, Send, KeyRound, Info, AlertCircle } from 'lucide-react'
import { Button, Input } from '../components/ui'
import { ApiError, authApi } from '../api'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ email?: string; general?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [responseMessage, setResponseMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { email?: string; general?: string } = {}
    if (!email.trim()) {
      nextErrors.email = 'Vui lòng nhập địa chỉ email đã đăng ký của bạn'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Địa chỉ email không đúng định dạng'
    }

    setErrors(nextErrors)
    if (nextErrors.email) return

    setIsSubmitting(true)
    setSubmitted(false)
    try {
      const response = await authApi.forgotPassword({ email: email.trim() })
      setSubmitted(true)
      setResponseMessage(response.message)
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        general: error instanceof ApiError
          ? error.message
          : 'Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.',
      }))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
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

        <h1 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Quên mật khẩu?
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-medium">
          Nhập email tài khoản để nhận hướng dẫn khôi phục mật khẩu.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[rgba(255,255,255,0.85)] dark:bg-[rgba(15,23,42,0.85)] backdrop-blur-2xl py-8 px-6 sm:px-8 rounded-3xl border border-white/85 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.7)_inset,0_1px_2px_rgba(255,255,255,0.95)_inset] relative overflow-hidden">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto mb-2 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
              <KeyRound className="w-7 h-7" />
            </div>
          </div>

          {errors.general && (
            <div role="alert" className="mb-5 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              id="forgot-email"
              type="email"
              label="Địa chỉ Email đã đăng ký"
              required
              placeholder="tenban@vi-du.vn"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setErrors((prev) => ({ ...prev, email: undefined, general: undefined }))
                setSubmitted(false)
                setResponseMessage('')
              }}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              autoFocus
            />

            <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>Nếu email đã đăng ký, mật khẩu tạm sẽ được gửi đến hộp thư của bạn. Nếu chưa nhận được, hãy kiểm tra thư rác và thử lại sau 10 phút.</span>
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}
                loadingText="Đang gửi yêu cầu..." leftIcon={!isSubmitting ? <Send className="w-4 h-4" /> : undefined}>
                {submitted ? 'Gửi lại yêu cầu' : 'Gửi yêu cầu khôi phục'}
              </Button>
            </div>
          </form>

          {submitted && (
            <p role="status" aria-live="polite" className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-50/80 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              {responseMessage} Mật khẩu tạm có hiệu lực trong 15 phút.
            </p>
          )}

          <div className="mt-6 pt-5 border-t border-white/60 dark:border-white/10 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại Đăng nhập</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Dữ liệu được bảo mật chuẩn mã hóa an toàn</span>
        </div>
      </div>
    </div>
  )
}
