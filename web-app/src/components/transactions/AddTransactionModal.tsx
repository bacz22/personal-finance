import React from 'react'
import { TransactionModal, type TransactionModalProps } from './TransactionModal'

export interface AddTransactionModalProps extends Omit<TransactionModalProps, 'mode'> {}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = (props) => {
  return <TransactionModal {...props} mode="add" />
}
