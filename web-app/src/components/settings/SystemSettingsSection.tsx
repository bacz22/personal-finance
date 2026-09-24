import React, { useState } from 'react'
import {
  Sliders,
  Eye,
  RotateCcw,
  Sparkles,
  Check,
  Wallet,
  ShieldCheck,
  Palette,
} from 'lucide-react'
import { Button, useToast } from '../ui'
import {
  THEME_PRESETS,
  DEFAULT_GLASS_SETTINGS,
  getStoredGlassSettings,
  applyGlassSettings,
  type GlassSettings,
} from '../../utils/theme'

export const SystemSettingsSection: React.FC = () => {
  const toast = useToast()
  const [settings, setSettings] = useState<GlassSettings>(getStoredGlassSettings)

  // Đồng bộ cài đặt mỗi khi state thay đổi
  const updateSettings = (partial: Partial<GlassSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial }
      applyGlassSettings(next)
      return next
    })
  }

  // Khôi phục về mặc định ban đầu
  const handleResetDefaults = () => {
    setSettings(DEFAULT_GLASS_SETTINGS)
    applyGlassSettings(DEFAULT_GLASS_SETTINGS)
    toast.success('Đã khôi phục cài đặt hiển thị và độ trong suốt về mặc định ban đầu!', {
      title: 'Khôi phục thành công',
    })
  }

  // Lấy theme hiện tại
  const currentTheme =
    THEME_PRESETS.find((t) => t.id === settings.theme) || THEME_PRESETS[0]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. KHUNG XEM TRƯỚC TRỰC TIẾP (LIVE PREVIEW BOX - ĐẶT LÊN ĐẦU TIÊN ĐỂ DỄ QUAN SÁT) */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Xem trước hiển thị thời gian thực (Live Preview)
              </h2>
              <p className="text-xs text-slate-500">
                Thẻ kính mô phỏng sẽ thay đổi độ trong suốt và hiệu ứng khúc xạ ngay khi bạn điều chỉnh.
              </p>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <Sparkles className="w-3 h-3" />
            {currentTheme.shortName}
          </span>
        </div>

        {/* Khung Canvas mô phỏng nền ứng dụng và hiệu ứng kính */}
        <div
          className="relative rounded-2xl p-4 sm:p-6 overflow-hidden border border-slate-200/80 shadow-inner min-h-[260px] flex items-center justify-center"
          style={{
            background:
              settings.theme === 'ocean'
                ? 'linear-gradient(135deg, #BAE6FD 0%, #E0F2FE 40%, #DBEAFE 100%)'
                : settings.theme === 'cosmic'
                ? 'linear-gradient(135deg, #DDD6FE 0%, #F5F3FF 40%, #FCE7F3 100%)'
                : settings.theme === 'sunset'
                ? 'linear-gradient(135deg, #FED7AA 0%, #FFF1F2 40%, #FEE2E2 100%)'
                : settings.theme === 'slate'
                ? 'linear-gradient(135deg, #CBD5E1 0%, #F1F5F9 40%, #E2E8F0 100%)'
                : 'linear-gradient(135deg, #A7F3D0 0%, #F0FDF4 40%, #BAE6FD 100%)',
          }}
        >
          {/* Các đốm sáng phát quang trang trí phía sau kính */}
          <div className="absolute top-2 left-4 w-32 h-32 rounded-full bg-emerald-500/35 blur-2xl pointer-events-none" />
          <div className="absolute bottom-2 right-4 w-40 h-40 rounded-full bg-sky-500/35 blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-indigo-400/25 blur-3xl pointer-events-none" />

          {/* THẺ KÍNH LIQUID GLASS MÔ PHỎNG (Sử dụng trực tiếp state opacity và blur) */}
          <div
            className="theme-preview-glass relative z-10 w-full max-w-md rounded-2xl p-5 border border-white/70 dark:border-slate-600/70 shadow-[0_8px_32px_rgba(15,23,42,0.12)] transition-all duration-150 select-none"
            style={{
              '--preview-opacity': settings.opacity / 100,
              backdropFilter: `blur(${settings.blur}px)`,
              WebkitBackdropFilter: `blur(${settings.blur}px)`,
            } as React.CSSProperties}
          >
            {/* Header thẻ mô phỏng */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800 leading-tight">
                    Bề mặt giao diện
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Hiệu ứng Liquid Glassmorphism
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3 h-3" />
                Xem trước
              </span>
            </div>

            {/* Sample data placeholder */}
            <div className="py-3.5">
              <span className="text-[11px] text-slate-400 font-medium block">
                Dữ liệu tài chính
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-sm sm:text-base font-semibold text-slate-500 tracking-tight">
                  Sẽ hiển thị sau khi kết nối API
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THANH TRƯỢT ĐIỀU CHỈNH ĐỘ TRONG SUỐT (GLASS OPACITY SLIDER) */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                Độ trong suốt của bề mặt kính (Glass Opacity)
              </h2>
              <p className="text-xs text-slate-500">
                Kéo thanh trượt để tăng độ trong suốt giúp làm nổi bật nền hoặc tăng độ đục để văn bản tương phản rõ hơn.
              </p>
            </div>
          </div>
        </div>

        {/* Thanh trượt Range Input */}
        <div className="space-y-2 pt-2">
          <input
            type="range"
            min={40}
            max={95}
            step={1}
            value={settings.opacity}
            onChange={(e) => updateSettings({ opacity: Number(e.target.value) })}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            aria-label="Điều chỉnh độ trong suốt nền kính"
          />
          <div className="flex justify-between text-[11px] text-slate-400 font-medium">
            <span>40%</span>
            <span>75% - 85%</span>
            <span>95%</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHỌN THEME NỀN LIQUID GLASS PHÙ HỢP */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/90 shadow-[0_4px_24px_rgba(15,23,42,0.06)] space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-700 flex items-center justify-center">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Không gian màu nền Liquid Glass
            </h2>
            <p className="text-xs text-slate-500">
              Chọn phong cách dải màu nền để ánh sáng khúc xạ qua kính đạt vẻ đẹp ưng ý nhất.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {THEME_PRESETS.map((preset) => {
            const isSelected = settings.theme === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => updateSettings({ theme: preset.id })}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--glass-surface,rgba(255,255,255,0.95))] border-emerald-600 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-slate-50/70 hover:bg-[var(--glass-surface,rgba(255,255,255,0.85))] border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Swatch tròn gradient */}
                <div
                  className="w-10 h-10 rounded-xl shadow-xs shrink-0 flex items-center justify-center border border-white/60"
                  style={{ background: preset.gradientPreview }}
                >
                  {isSelected && <Check className="w-5 h-5 text-white drop-shadow-xs" />}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-slate-800 block truncate">
                    {preset.name}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                    {preset.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. KHÔI PHỤC MẶC ĐỊNH & THÔNG TIN LƯU TRỮ */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--glass-surface,rgba(255,255,255,0.75))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Cài đặt hiển thị được tự động lưu trên trình duyệt của bạn và duy trì giữa các phiên làm việc.
          </span>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleResetDefaults}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="shrink-0 rounded-xl"
        >
          Khôi phục mặc định
        </Button>
      </div>
    </div>
  )
}
