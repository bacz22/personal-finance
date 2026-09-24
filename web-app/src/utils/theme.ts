export interface ThemePreset {
  id: string
  name: string
  shortName: string
  gradientPreview: string
  description: string
  accentColor: string
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'emerald',
    name: 'Emerald Aurora (Mặc định)',
    shortName: 'Emerald Aurora',
    gradientPreview: 'linear-gradient(135deg, #10B981 0%, #0EA5E9 100%)',
    description: 'Xanh ngọc lục bảo & Xanh lơ dịu mát',
    accentColor: '#10B981',
  },
  {
    id: 'ocean',
    name: 'Ocean Breeze',
    shortName: 'Ocean Breeze',
    gradientPreview: 'linear-gradient(135deg, #0EA5E9 0%, #3B82F6 100%)',
    description: 'Biển sâu & Lam ngọc thanh khiết',
    accentColor: '#0EA5E9',
  },
  {
    id: 'cosmic',
    name: 'Cosmic Violet',
    shortName: 'Cosmic Violet',
    gradientPreview: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
    description: 'Tím thạch anh & Lam đêm Indigo sang trọng',
    accentColor: '#8B5CF6',
  },
  {
    id: 'sunset',
    name: 'Sunset Glow',
    shortName: 'Sunset Glow',
    gradientPreview: 'linear-gradient(135deg, #F97316 0%, #F43F5E 100%)',
    description: 'Hoàng hôn ấm áp, Cam đào & Hồng pastel',
    accentColor: '#F97316',
  },
  {
    id: 'slate',
    name: 'Frosted Slate',
    shortName: 'Frosted Slate',
    gradientPreview: 'linear-gradient(135deg, #64748B 0%, #94A3B8 100%)',
    description: 'Xám bạc tối giản, sạch sẽ thanh lịch',
    accentColor: '#64748B',
  },
]

export const DEFAULT_GLASS_SETTINGS = {
  opacity: 82, // 82%
  blur: 16, // 16px
  theme: 'emerald',
}

const STORAGE_KEY_SETTINGS = 'expense_app_glass_settings'

export interface GlassSettings {
  opacity: number
  blur: number
  theme: string
}

export function getStoredGlassSettings(): GlassSettings {
  if (typeof window === 'undefined') return DEFAULT_GLASS_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        opacity: typeof parsed.opacity === 'number' ? parsed.opacity : DEFAULT_GLASS_SETTINGS.opacity,
        blur: typeof parsed.blur === 'number' ? parsed.blur : DEFAULT_GLASS_SETTINGS.blur,
        theme: typeof parsed.theme === 'string' ? parsed.theme : DEFAULT_GLASS_SETTINGS.theme,
      }
    }
  } catch (err) {
    console.error('Failed to parse glass settings from localStorage:', err)
  }
  return DEFAULT_GLASS_SETTINGS
}

export function applyGlassSettings(settings: GlassSettings): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const alpha = (settings.opacity / 100).toFixed(2)

  // Áp dụng CSS custom properties
  root.style.setProperty('--glass-opacity', alpha)
  root.style.setProperty('--glass-blur', `${settings.blur}px`)
  // These surfaces are resolved by CSS so they can follow prefers-color-scheme.
  root.style.removeProperty('--glass-surface')
  root.style.removeProperty('--glass-border')

  // Gán theme nền
  if (settings.theme === 'emerald') {
    root.removeAttribute('data-bg-theme')
  } else {
    root.setAttribute('data-bg-theme', settings.theme)
  }

  // Lưu lại vào localStorage
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings))
  } catch (err) {
    console.error('Failed to save glass settings to localStorage:', err)
  }
}

export function initGlassSettings(): GlassSettings {
  const settings = getStoredGlassSettings()
  applyGlassSettings(settings)
  return settings
}
