package com.finance.personalfinance.dashboard.domain.repository;

import java.math.BigDecimal;

public interface DashboardTotalsProjection {
    BigDecimal getIncome();

    BigDecimal getExpense();

    Long getTransactionCount();
}
