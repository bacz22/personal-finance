package com.finance.personalfinance.reports.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.util.List;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record MonthlyComparisonResponse(
        String monthA,
        String monthB,
        BigDecimal totalMonthA,
        BigDecimal totalMonthB,
        BigDecimal diffAmount,
        BigDecimal percentChange,
        List<MonthlyComparisonCategoryResponse> categoryBreakdown
) {
}
