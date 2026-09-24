import React, { useEffect, useState } from 'react'
import { AlertCircle, Lock, LogOut, Mail, Save, User } from 'lucide-react'
import { ApiError, type UserSummary } from '../../api'
import { Button, Input } from '../ui'

export interface ProfileSectionProps {
  profile: UserSummary
  onUpdateProfile: (fullName: string) => Promise<void>
  onLogout: () => Promise<void>
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile,
  onUpdateProfile,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(profile.fullName)
  const [fullNameError, setFullNameError] = useState('')
  const [requestError, setRequestError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const isDirty = fullName.trim() !== profile.fullName

  useEffect(() => {
    setFullName(profile.fullName)
  }, [profile.fullName])

  const initials = profile.fullName
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((word) => word[0].toUpperCase())
    .join('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedName = fullName.trim()
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      setFullNameError('Họ và tên phải có từ 2 đến 120 ký tự.')
      return
    }

    setIsSaving(true)
    setFullNameError('')
    setRequestError('')
    try {
      await onUpdateProfile(trimmedName)
    } catch (error) {
      let hasFieldError = false
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        const fieldError = error.fieldErrors.find((item) => item.field === 'fullName')
        if (fieldError) {
          setFullNameError(fieldError.message)
          hasFieldError = true
        }
      }
      setRequestError(hasFieldError ? '' : error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-900/60">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Thông tin hồ sơ</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Thông tin tài khoản được tải từ máy chủ.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-bold text-xl flex items-center justify-center shadow-xs select-none">
            {initials || <User className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{profile.fullName}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{profile.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            id="profile-fullname"
            label="Họ và tên"
            required
            value={fullName}
            onChange={(event) => {
              setFullName(event.target.value)
              setFullNameError('')
              setRequestError('')
            }}
            error={fullNameError}
            leftIcon={<User className="w-4 h-4" />}
            autoComplete="name"
          />
          <Input
            id="profile-email"
            label="Địa chỉ Email"
            type="email"
            value={profile.email}
            disabled
            readOnly
            leftIcon={<Mail className="w-4 h-4" />}
            rightIcon={<Lock className="w-3.5 h-3.5" />}
            helperText="Email hiện được giữ cố định cho tài khoản."
          />
        </div>

        {requestError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{requestError}</span>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="danger"
            leftIcon={<LogOut className="w-4 h-4" />}
            onClick={() => void handleLogout()}
            isLoading={isLoggingOut}
            loadingText="Đang đăng xuất..."
            className="w-full sm:w-auto"
          >
            Đăng xuất
          </Button>
          <Button
            type="submit"
            variant="primary"
            leftIcon={<Save className="w-4 h-4" />}
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
            loadingText="Đang cập nhật..."
            className="w-full sm:w-auto"
          >
            Cập nhật thông tin
          </Button>
        </div>
      </form>
    </div>
  )
}
