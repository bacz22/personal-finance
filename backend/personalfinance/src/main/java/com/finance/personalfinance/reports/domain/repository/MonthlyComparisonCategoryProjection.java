package com.finance.personalfinance.reports.domain.repository;

import java.math.BigDecimal;

public interface MonthlyComparisonCategoryProjection {

    Long getCategoryId();

    String getCategoryName();

    String getCategoryIconKey();

    String getCategoryColor();

    BigDecimal getMonthAAmount();

    BigDecimal getMonthBAmount();
}
