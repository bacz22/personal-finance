package com.finance.personalfinance.dashboard.api;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DashboardDailyExpenseResponse(
        LocalDate date,
        int day,
        BigDecimal amount
) {
}
