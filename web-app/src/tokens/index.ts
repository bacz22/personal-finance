import React from 'react'

/**
 * ============================================================================
 * DESIGN SYSTEM TOKEN REGISTRY (Liquid Glass Tier 3 System)
 * ============================================================================
 * Centralized design token repository for the Personal Finance Web Application.
 * Follows the 3-Layer Token Architecture: Primitive -> Semantic -> Component.
 *
 * All color tokens use CSS Custom Properties with fallback values, enabling
 * instant theme switching (Emerald, Sapphire Blue, Violet, Dark Mode) without
 * altering component logic.
 */

// ============================================================================
// 1. BRAND TOKENS
// ============================================================================
export const BRAND_TOKENS = {
  primary: 'var(--color-brand-primary, #059669)',
  hover: 'var(--color-brand-hover, #047857)',
  light: 'var(--color-brand-light, rgba(16, 185, 129, 0.14))',
  ring: 'var(--color-brand-ring, rgba(16, 185, 129, 0.25))',
} as const

// ============================================================================
// 2. FINANCIAL SEMANTIC TOKENS (DOUBLE-ENCODED)
// ============================================================================
export const FINANCIAL_SEMANTICS = {
  income: {
    text: 'var(--color-income, #059669)',
    hover: 'var(--color-income-hover, #047857)',
    bg: 'var(--color-income-bg, rgba(16, 185, 129, 0.12))',
    border: 'var(--color-income-border, rgba(16, 185, 129, 0.25))',
  },
  expense: {
    text: 'var(--color-expense, #E11D48)',
    hover: 'var(--color-expense-hover, #BE123C)',
    bg: 'var(--color-expense-bg, rgba(225, 29, 72, 0.12))',
    border: 'var(--color-expense-border, rgba(225, 29, 72, 0.25))',
  },
  warning: {
    text: 'var(--color-warning, #D97706)',
    bg: 'var(--color-warning-bg, rgba(217, 119, 6, 0.12))',
    border: 'var(--color-warning-border, rgba(217, 119, 6, 0.25))',
  },
  danger: {
    text: 'var(--color-danger, #DC2626)',
    bg: 'var(--color-danger-bg, rgba(220, 38, 38, 0.12))',
    border: 'var(--color-danger-border, rgba(220, 38, 38, 0.25))',
  },
} as const

// ============================================================================
// 3. CATEGORY COLOR TOKENS
// ============================================================================
export const CATEGORY_COLORS = {
  food: 'var(--cat-food, #F97316)',
  housing: 'var(--cat-housing, #2563EB)',
  transport: 'var(--cat-transport, #0D9488)',
  shopping: 'var(--cat-shopping, #8B5CF6)',
  entertainment: 'var(--cat-entertainment, #EC4899)',
  health: 'var(--cat-health, #06B6D4)',
  education: 'var(--cat-education, #10B981)',
  salary: 'var(--cat-salary, #059669)',
  bonus: 'var(--cat-bonus, #059669)',
  invest: 'var(--cat-invest, #059669)',
  other: 'var(--cat-other, #64748B)',
} as const

/** Ánh xạ tên tiếng Việt của danh mục sang Token màu tương ứng */
export const CATEGORY_NAME_TO_TOKEN: Record<string, string> = {
  'all': 'var(--cat-other, #64748B)',
  'Tất cả danh mục': 'var(--cat-other, #64748B)',
  'Ăn uống': CATEGORY_COLORS.food,
  'Nhà cửa & Tiện ích': CATEGORY_COLORS.housing,
  'Nhà ở': CATEGORY_COLORS.housing,
  'Đi lại & Xăng xe': CATEGORY_COLORS.transport,
  'Đi lại': CATEGORY_COLORS.transport,
  'Mua sắm cá nhân': CATEGORY_COLORS.shopping,
  'Mua sắm': CATEGORY_COLORS.shopping,
  'Giải trí & Du lịch': CATEGORY_COLORS.entertainment,
  'Giải trí': CATEGORY_COLORS.entertainment,
  'Sức khỏe & Y tế': CATEGORY_COLORS.health,
  'Sức khỏe': CATEGORY_COLORS.health,
  'Giáo dục & Học tập': CATEGORY_COLORS.education,
  'Giáo dục': CATEGORY_COLORS.education,
  'Tiền lương': CATEGORY_COLORS.salary,
  'Lương': CATEGORY_COLORS.salary,
  'Thưởng': CATEGORY_COLORS.bonus,
  'Freelance & Đầu tư': CATEGORY_COLORS.invest,
  'Khác': CATEGORY_COLORS.other,
}

// ============================================================================
// 4. CHART DESIGN TOKENS
// ============================================================================
export const CHART_TOKENS = {
  // Palette các lát cắt Donut / Bar phân loại
  chart1: 'var(--chart-1, #F97316)',
  chart2: 'var(--chart-2, #2563EB)',
  chart3: 'var(--chart-3, #0D9488)',
  chart4: 'var(--chart-4, #8B5CF6)',
  chart5: 'var(--chart-5, #EC4899)',
  chart6: 'var(--chart-6, #06B6D4)',
  chart7: 'var(--chart-7, #10B981)',
  chart8: 'var(--chart-8, #64748B)',

  // Các thành phần kỹ thuật trục biểu đồ (Axes & Grid)
  grid: 'var(--chart-grid, #E2E8F0)',
  axis: 'var(--chart-axis, #CBD5E1)',
  text: 'var(--chart-text, #94A3B8)',
  tooltipBg: 'var(--chart-tooltip-bg, #0F172A)',
  tooltipText: 'var(--chart-tooltip-text, #FFFFFF)',

  // Kỳ báo cáo so sánh (Report comparison)
  monthA: 'var(--chart-2, #3B82F6)',
  monthB: 'var(--chart-7, #10B981)',
} as const

// ============================================================================
// 5. HELPER UTILITIES
// ============================================================================

/**
 * Lấy token màu sắc tương ứng theo tên danh mục hoặc mã danh mục
 */
export function getCategoryColorToken(categoryNameOrId: string): string {
  if (CATEGORY_NAME_TO_TOKEN[categoryNameOrId]) {
    return CATEGORY_NAME_TO_TOKEN[categoryNameOrId]
  }
  const normalized = categoryNameOrId.toLowerCase().trim()
  if (normalized.includes('ăn') || normalized.includes('food')) return CATEGORY_COLORS.food
  if (normalized.includes('nhà') || normalized.includes('hous')) return CATEGORY_COLORS.housing
  if (normalized.includes('đi') || normalized.includes('xe') || normalized.includes('trans')) return CATEGORY_COLORS.transport
  if (normalized.includes('sắm') || normalized.includes('shop')) return CATEGORY_COLORS.shopping
  if (normalized.includes('trí') || normalized.includes('entertain')) return CATEGORY_COLORS.entertainment
  if (normalized.includes('khỏe') || normalized.includes('y tế') || normalized.includes('health')) return CATEGORY_COLORS.health
  if (normalized.includes('dục') || normalized.includes('học') || normalized.includes('educat')) return CATEGORY_COLORS.education
  if (normalized.includes('lương') || normalized.includes('salary')) return CATEGORY_COLORS.salary
  if (normalized.includes('thưởng') || normalized.includes('bonus')) return CATEGORY_COLORS.bonus
  if (normalized.includes('đầu tư') || normalized.includes('invest')) return CATEGORY_COLORS.invest
  return CATEGORY_COLORS.other
}

/**
 * Sinh object style inline cho huy hiệu icon danh mục
 * Tương thích 100% cả với CSS Custom Properties (dùng color-mix) và raw hex legacy
 */
export function getCategoryBadgeStyle(colorTokenOrHex: string): React.CSSProperties {
  if (colorTokenOrHex.startsWith('var(')) {
    return {
      backgroundColor: `color-mix(in srgb, ${colorTokenOrHex} 14%, transparent)`,
      color: colorTokenOrHex,
    }
  }
  return {
    backgroundColor: `${colorTokenOrHex}18`,
    color: colorTokenOrHex,
  }
}
