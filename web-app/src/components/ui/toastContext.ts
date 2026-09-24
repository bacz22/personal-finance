import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastOptions {
  id?: string
  title?: string
  duration?: number // ms, default 4000ms
  action?: ToastAction
}

export interface ToastItemData {
  id: string
  type: ToastType
  message: string
  title?: string
  duration: number
  action?: ToastAction
  createdAt: number
}

export interface ToastContextValue {
  showToast: (type: ToastType, message: string, options?: ToastOptions) => string
  dismissToast: (id: string) => void
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  // Các hàm preset chuẩn hóa theo Prompt 26
  transactionAdded: (title?: string) => string
  transactionUpdated: (title?: string) => string
  transactionDeleted: (title?: string) => string
  budgetSaved: (categoryName?: string) => string
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
