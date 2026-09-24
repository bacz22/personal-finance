package com.finance.personalfinance.dashboard.domain.repository;

import java.math.BigDecimal;

public interface DashboardCategoryProjection {
    Long getCategoryId();

    String getCategoryName();

    String getIconKey();

    String getColor();

    BigDecimal getAmount();
}
