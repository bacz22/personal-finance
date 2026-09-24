package com.finance.personalfinance.dashboard.api;

import java.math.BigDecimal;

public record DashboardCategoryResponse(
        Long id,
        String categoryName,
        String categoryIconKey,
        String categoryColor,
        BigDecimal amount
) {
}
