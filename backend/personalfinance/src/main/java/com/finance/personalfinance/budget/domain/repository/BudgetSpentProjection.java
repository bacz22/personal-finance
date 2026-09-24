package com.finance.personalfinance.budget.domain.repository;

import java.math.BigDecimal;

public interface BudgetSpentProjection {
    Long getCategoryId();

    BigDecimal getSpent();
}
