import React from 'react'
import { PiggyBank } from 'lucide-react'
import { EmptyState } from '../ui/EmptyState'

export interface EmptyBudgetStateProps {
  month: number
  year: number
  onAddBudget?: () => void
  className?: string
}

export const EmptyBudgetState: React.FC<EmptyBudgetStateProps> = ({
  month,
  year,
  onAddBudget,
  className = '',
}) => {
  return (
    <EmptyState
      icon={PiggyBank}
      title={`Chưa có ngân sách cho Tháng ${String(month).padStart(2, '0')}/${year}`}
      description="Bạn chưa thiết lập hạn mức chi tiêu cho tháng này. Hãy phân bổ ngân sách theo từng danh mục (Ăn uống, Nhà cửa, Đi lại...) để kiểm soát tài chính chủ động hơn."
      actionLabel={onAddBudget ? 'Thiết lập ngân sách ngay' : undefined}
      onAction={onAddBudget}
      className={className}
    />
  )
}
