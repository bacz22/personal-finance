// The UI calculates and charts money with JavaScript numbers. Beyond this range,
// a cent can be lost when JSON decimals are converted to IEEE-754 numbers.
export const MAX_UI_MONEY = 1_000_000_000_000

export function safeMoney(value: number): number {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_UI_MONEY) {
    throw new Error('Số tiền vượt giới hạn hiển thị chính xác của giao diện. Vui lòng liên hệ hỗ trợ.')
  }
  return Math.round(value * 100) / 100
}

export function formatMoneyDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}
