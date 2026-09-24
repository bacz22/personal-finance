/**
 * Utility functions for formatting currencies, dates, and numbers in Vietnamese standards
 */

/**
 * Format a number as Vietnamese Dong (VND): 14.250.000 ₫
 * @param amount Số tiền
 * @param showSign Nếu true, luôn hiển thị dấu + cho số dương (+15.000.000 ₫)
 */
export function formatVND(amount: number, showSign: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '0 VND'
  }

  const isNegative = amount < 0
  const absAmount = Math.abs(amount)

  // Format with dots as thousands separator
  const formattedNumber = new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 0,
  }).format(absAmount)

  if (isNegative) {
    return `-${formattedNumber} VND`
  }

  if (showSign && amount > 0) {
    return `+${formattedNumber} VND`
  }

  return `${formattedNumber} VND`
}

/**
 * Format compact VND for charts or small spaces: 1.5tr, 500k
 */
export function formatCompactVND(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace('.0', '')} tỷ`
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace('.0', '')} tr`
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(0)} k`
  }
  return `${sign}${abs} VND`
}

/**
 * Format a date string or Date object to DD/MM/YYYY
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

/**
 * Format month/year for the month selector.
 */
export function formatMonthYear(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `Tháng ${month}, ${d.getFullYear()}`
}
