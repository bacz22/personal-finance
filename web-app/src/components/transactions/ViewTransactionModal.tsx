import React from 'react'
import { TransactionModal, type TransactionModalProps } from './TransactionModal'
import { type Transaction } from './types'

export interface ViewTransactionModalProps
  extends Omit<TransactionModalProps, 'mode' | 'initialData'> {
  transaction: Transaction | null
  onEdit?: (transaction: Transaction) => void
}

export const ViewTransactionModal: React.FC<ViewTransactionModalProps> = ({
  transaction,
  onEdit,
  ...props
}) => {
  return (
    <TransactionModal
      {...props}
      mode="view"
      initialData={transaction}
      onEdit={onEdit}
    />
  )
}
