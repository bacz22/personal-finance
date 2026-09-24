package com.finance.personalfinance.transaction.api;

import java.math.BigDecimal;

public record TransactionTotalsResponse(BigDecimal income, BigDecimal expense, BigDecimal balance) {

    public static TransactionTotalsResponse of(BigDecimal income, BigDecimal expense) {
        BigDecimal safeIncome = income == null ? BigDecimal.ZERO : income;
        BigDecimal safeExpense = expense == null ? BigDecimal.ZERO : expense;
        return new TransactionTotalsResponse(safeIncome, safeExpense, safeIncome.subtract(safeExpense));
    }
}
