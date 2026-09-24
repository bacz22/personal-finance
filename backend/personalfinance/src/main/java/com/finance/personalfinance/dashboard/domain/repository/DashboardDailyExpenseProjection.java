package com.finance.personalfinance.dashboard.domain.repository;

import java.math.BigDecimal;
import java.time.LocalDate;

public interface DashboardDailyExpenseProjection {
    LocalDate getTransactionDate();

    BigDecimal getAmount();
}
