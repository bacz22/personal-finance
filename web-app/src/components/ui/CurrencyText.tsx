import React from 'react'
import { formatVND } from '../../utils/formatters'

export type CurrencyType = 'income' | 'expense' | 'neutral' | 'balance'
export type CurrencySize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

export interface CurrencyTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  amount: number
  type?: CurrencyType
  size?: CurrencySize
  showSign?: boolean
}

const typeStyles: Record<CurrencyType, string> = {
  income: 'text-emerald-700 font-semibold',
  expense: 'text-rose-700 font-semibold',
  balance: 'text-blue-700 font-semibold',
  neutral: 'text-slate-900 font-medium',
}

const sizeStyles: Record<CurrencySize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base font-semibold',
  lg: 'text-lg font-bold',
  xl: 'text-xl md:text-2xl font-bold tracking-tight',
  '2xl': 'text-2xl md:text-3xl font-extrabold tracking-tight',
}

export const CurrencyText: React.FC<CurrencyTextProps> = ({
  amount,
  type = 'neutral',
  size = 'md',
  showSign = false,
  className = '',
  ...props
}) => {
  // Determine sign behavior
  const absAmount = Math.abs(amount)
  const baseFormatted = formatVND(absAmount, false)

  let formatted: string
  if (isNaN(amount) || amount === null || amount === undefined) {
    formatted = '0 VND'
  } else if (type === 'expense') {
    // Với khoản chi: khi showSign hoặc số tiền âm (và > 0), hiển thị dấu -
    formatted = (showSign || amount < 0) && absAmount > 0 ? `-${baseFormatted}` : baseFormatted
  } else if (type === 'income') {
    // Với khoản thu: khi showSign (và > 0), hiển thị dấu +
    formatted = showSign && absAmount > 0 ? `+${baseFormatted}` : baseFormatted
  } else {
    // balance hoặc neutral: phụ thuộc vào giá trị toán học của amount
    if (amount < 0) {
      formatted = `-${baseFormatted}`
    } else if (showSign && amount > 0) {
      formatted = `+${baseFormatted}`
    } else {
      formatted = baseFormatted
    }
  }

  return (
    <span
      className={`tabular-nums inline-block select-text ${typeStyles[type]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {formatted}
    </span>
  )
}
