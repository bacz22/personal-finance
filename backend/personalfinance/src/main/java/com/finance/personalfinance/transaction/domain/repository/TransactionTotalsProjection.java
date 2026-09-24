package com.finance.personalfinance.transaction.domain.repository;

import java.math.BigDecimal;

public interface TransactionTotalsProjection {
    BigDecimal getIncome();

    BigDecimal getExpense();
}
