import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, ShieldCheck, Wallet } from 'lucide-react'
import { ApiError } from '../api'
import { useAuth } from '../AuthContext'
import { Button, Input, useToast } from '../components/ui'

export const ChangeTemporaryPasswordPage: React.FC = () => {
  const { changePassword, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (newPassword.length < 8 || newPassword.length > 100) {
      nextErrors.newPassword = 'Mật khẩu mới phải có từ 8 đến 100 ký tự.'
    } else if (!/\d/.test(newPassword)) {
      nextErrors.newPassword = 'Mật khẩu mới cần chứa ít nhất một chữ số.'
    }
    if (!confirmPassword) nextErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.'
    else if (confirmPassword !== newPassword) nextErrors.confirmPassword = 'Mật khẩu xác nhận không trùng khớp.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword: '', newPassword, confirmPassword })
      toast.success('Đã đổi mật khẩu. Bạn có thể tiếp tục sử dụng ứng dụng.')
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const fieldErrors = error instanceof ApiError
        ? Object.fromEntries(error.fieldErrors.map(({ field, message }) => [field, message]))
        : {}
      setErrors({
        currentPassword: fieldErrors.currentPassword,
        newPassword: fieldErrors.newPassword,
        confirmPassword: fieldErrors.confirmPassword || fieldErrors.passwordMatching,
        general: error instanceof Error ? error.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-3 rounded-2xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg">
            <Wallet className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="text-left">
            <span className="block font-black text-xl tracking-tight text-slate-900 dark:text-white">Ghi chú chi tiêu</span>
            <span className="block text-xs text-slate-500 dark:text-slate-400">Quản lý tài chính cá nhân</span>
          </div>
        </Link>
        <h1 className="mt-6 text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
          Tạo mật khẩu mới
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
          Vì bạn đang dùng mật khẩu tạm, hãy đổi mật khẩu trước khi tiếp tục.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[rgba(255,255,255,0.9)] dark:bg-[rgba(15,23,42,0.9)] backdrop-blur-2xl py-8 px-6 sm:px-8 rounded-3xl border border-white/85 dark:border-white/10 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
          {errors.general && (
            <p role="alert" className="mb-5 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              {errors.general}
            </p>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Input
              id="new-password"
              label="Mật khẩu mới"
              type="password"
              required
              autoComplete="new-password"
              helperText="Dùng từ 8 đến 100 ký tự và thêm ít nhất một chữ số."
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              error={errors.newPassword}
              leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
            />
            <Input
              id="confirm-new-password"
              label="Xác nhận mật khẩu mới"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" aria-hidden="true" />}
            />

            <Button type="submit" variant="primary" size="lg" fullWidth isLoading={isSubmitting}
              loadingText="Đang cập nhật..." leftIcon={!isSubmitting ? <ArrowRight className="w-4 h-4" /> : undefined}>
              Cập nhật mật khẩu
            </Button>
          </form>

          <div className="mt-5 border-t border-slate-200/80 dark:border-white/10 pt-4 flex justify-center">
            <Button type="button" variant="ghost" onClick={handleLogout}>
              Đăng xuất
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>Mật khẩu được mã hóa khi lưu.</span>
        </div>
      </div>
    </div>
  )
}
