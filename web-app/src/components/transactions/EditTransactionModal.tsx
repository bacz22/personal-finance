import React from 'react'
import { TransactionModal, type TransactionModalProps } from './TransactionModal'
import { type Transaction } from './types'

export interface EditTransactionModalProps extends Omit<TransactionModalProps, 'mode' | 'initialData'> {
  transaction: Transaction | null
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  ...props
}) => {
  return <TransactionModal {...props} mode="edit" initialData={transaction} />
}
