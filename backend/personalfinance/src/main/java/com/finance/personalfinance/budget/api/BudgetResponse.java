package com.finance.personalfinance.budget.api;

import java.math.BigDecimal;

public record BudgetResponse(
        Long id,
        String month,
        Long categoryId,
        String categoryName,
        String categoryIconKey,
        String categoryColor,
        BigDecimal limitAmount,
        BigDecimal spent,
        long version
) {
}
