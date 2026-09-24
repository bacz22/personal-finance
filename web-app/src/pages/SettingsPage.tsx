import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, User, ShieldCheck, Sliders } from 'lucide-react'
import { useToast, Tabs } from '../components/ui'
import { useAuth } from '../AuthContext'
import {
  ProfileSection,
  SecuritySection,
  SystemSettingsSection,
  type PasswordChangeData,
} from '../components/settings'

type SettingsTab = 'profile' | 'security' | 'system'

export const SettingsPage: React.FC = () => {
  const toast = useToast()
  const navigate = useNavigate()
  const { user, updateProfile, changePassword, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')

  const handleSavePassword = async (data: PasswordChangeData) => {
    await changePassword(data)
    toast.success('Đã đổi mật khẩu thành công.')
  }

  const handleUpdateProfile = async (fullName: string) => {
    await updateProfile({ fullName })
    toast.success('Đã cập nhật thông tin hồ sơ.')
  }

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Đã đăng xuất.')
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Đã hủy đăng xuất')) return
      toast.warning('Đã đăng xuất khỏi giao diện, nhưng backend chưa xác nhận thu hồi phiên.')
    }
    navigate('/login', { replace: true })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER TRANG CÀI ĐẶT */}
      {/* ========================================================================= */}
      <div className="pb-4 sm:pb-5 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 leading-tight">
            Cài đặt
          </h1>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <SettingsIcon className="w-3 h-3" />
            Hệ thống
          </span>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-normal">
          Quản lý thông tin hồ sơ tài khoản, bảo mật và tùy biến hiển thị Liquid Glass của bạn.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 2. BỘ CHỌN TAB: THÔNG TIN, BẢO MẬT & HỆ THỐNG */}
      {/* ========================================================================= */}
      <div className="flex justify-center sm:justify-start">
        <Tabs<SettingsTab>
          value={activeTab}
          onChange={setActiveTab}
          size="md"
          tabs={[
            {
              id: 'profile',
              label: 'Thông tin',
              icon: <User className="w-4 h-4" />,
              activeColor: 'emerald',
            },
            {
              id: 'security',
              label: 'Bảo mật',
              icon: <ShieldCheck className="w-4 h-4" />,
              activeColor: 'emerald',
            },
            {
              id: 'system',
              label: 'Hệ thống',
              icon: <Sliders className="w-4 h-4" />,
              activeColor: 'emerald',
            },
          ]}
        />
      </div>

      {/* ========================================================================= */}
      {/* 3. NỘI DUNG TAB TƯƠNG ỨNG */}
      {/* ========================================================================= */}
      <div>
        {activeTab === 'profile' ? (
          user ? (
            <ProfileSection
              profile={user}
              onUpdateProfile={handleUpdateProfile}
              onLogout={handleLogout}
            />
          ) : null
        ) : activeTab === 'security' ? (
          <SecuritySection onSave={handleSavePassword} />
        ) : (
          <SystemSettingsSection />
        )}
      </div>
    </div>
  )
}
