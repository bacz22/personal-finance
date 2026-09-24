import React, { useState } from 'react'
import {
  AlertCircle,
  Lock,
  KeyRound,
  ShieldCheck,
  Check,
  Shield,
} from 'lucide-react'
import { type PasswordChangeData } from './types'
import { Button, Input } from '../ui'
import { ApiError } from '../../api'

export interface SecuritySectionProps {
  onSave: (data: PasswordChangeData) => Promise<void>
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({ onSave }) => {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Validation & status
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [requestError, setRequestError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Password criteria check
  const hasMinLength = newPassword.length >= 8
  const hasNumber = /[0-9]/.test(newPassword)
  const passwordsMatch =
    newPassword.length > 0 && newPassword === confirmPassword

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu mới phải có tối thiểu 8 ký tự'
    } else if (newPassword.length > 100) {
      newErrors.newPassword = 'Mật khẩu mới không được vượt quá 100 ký tự'
    } else if (!hasNumber) {
      newErrors.newPassword = 'Mật khẩu mới phải chứa ít nhất một chữ số'
    } else if (newPassword === currentPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được trùng với mật khẩu hiện tại'
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận lại mật khẩu mới'
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu mới'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setRequestError('')
    setIsSubmitting(true)
    try {
      await onSave({ currentPassword, newPassword, confirmPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setErrors({})
    } catch (error) {
      if (error instanceof ApiError) {
        const fieldErrors = error.fieldErrors.reduce<Record<string, string>>((result, item) => {
          if (['currentPassword', 'newPassword', 'confirmPassword'].includes(item.field)) {
            result[item.field] = item.message
          }
          return result
        }, {})
        setErrors((previous) => ({ ...previous, ...fieldErrors }))
        setRequestError(Object.keys(fieldErrors).length > 0 ? '' : error.message)
      } else {
        setRequestError('Không thể đổi mật khẩu lúc này. Vui lòng thử lại.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-900/60">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Đổi mật khẩu
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cập nhật mật khẩu định kỳ để tăng cường an toàn cho tài khoản của bạn
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        {/* Banner lưu ý bảo mật */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Lưu ý an toàn:
            </span>{' '}
            Mật khẩu mới cần có từ 8 đến 100 ký tự và chứa ít nhất một chữ số.
          </div>
        </div>

        {requestError && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{requestError}</span>
          </div>
        )}

        {/* 1. Mật khẩu hiện tại */}
        <div>
          <Input
            id="security-current-password"
            label="Mật khẩu hiện tại"
            required
            type="password"
            showPasswordToggle
            leftIcon={<Lock className="w-4 h-4" />}
            value={currentPassword}
            maxLength={100}
            disabled={isSubmitting}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              setRequestError('')
              if (errors.currentPassword) {
                setErrors((prev) => ({ ...prev, currentPassword: '' }))
              }
            }}
            placeholder="Nhập mật khẩu bạn đang sử dụng..."
            error={errors.currentPassword}
          />
        </div>

        {/* 2. Mật khẩu mới */}
        <div>
          <Input
            id="security-new-password"
            label="Mật khẩu mới"
            required
            type="password"
            showPasswordToggle
            leftIcon={<KeyRound className="w-4 h-4" />}
            value={newPassword}
            maxLength={100}
            disabled={isSubmitting}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setRequestError('')
              if (errors.newPassword) {
                setErrors((prev) => ({ ...prev, newPassword: '' }))
              }
            }}
            placeholder="Nhập mật khẩu mới từ 8 ký tự..."
            error={errors.newPassword}
          />

          {/* Tiêu chí mật khẩu trực quan */}
          {newPassword.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span
                className={`inline-flex items-center gap-1 text-[11px] ${
                  hasMinLength
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {hasMinLength ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
                Tối thiểu 8 ký tự
              </span>

              <span
                className={`inline-flex items-center gap-1 text-[11px] ${
                  hasNumber
                    ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                    : 'text-slate-400'
                }`}
              >
                {hasNumber ? (
                  <Check className="w-3 h-3 stroke-[2.5]" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                )}
                Có ít nhất một chữ số
              </span>
            </div>
          )}
        </div>

        {/* 3. Xác nhận mật khẩu mới */}
        <div>
          <Input
            id="security-confirm-password"
            label="Xác nhận mật khẩu mới"
            required
            type="password"
            showPasswordToggle
            leftIcon={<Lock className="w-4 h-4" />}
            value={confirmPassword}
            maxLength={100}
            disabled={isSubmitting}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setRequestError('')
              if (errors.confirmPassword) {
                setErrors((prev) => ({ ...prev, confirmPassword: '' }))
              }
            }}
            placeholder="Nhập lại mật khẩu mới..."
            error={errors.confirmPassword}
            helperText={
              confirmPassword.length > 0 && passwordsMatch
                ? 'Mật khẩu xác nhận trùng khớp'
                : undefined
            }
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400 order-2 sm:order-1 text-center sm:text-left">
            Nhấn cập nhật để áp dụng mật khẩu mới ngay lập tức
          </p>
          <Button
            type="submit"
            variant="primary"
            size="md"
            leftIcon={<KeyRound className="w-4 h-4" />}
            isLoading={isSubmitting}
            loadingText="Đang cập nhật..."
            className="w-full sm:w-auto min-w-[150px] order-1 sm:order-2 cursor-pointer shadow-xs"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </form>
    </div>
  )
}
