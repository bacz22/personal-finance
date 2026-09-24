package com.finance.personalfinance.reports.api;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

@JsonInclude(JsonInclude.Include.ALWAYS)
public record MonthlyComparisonCategoryResponse(
        Long categoryId,
        String categoryName,
        String categoryIconKey,
        String categoryColor,
        BigDecimal monthAAmount,
        BigDecimal monthBAmount,
        BigDecimal diffAmount,
        BigDecimal percentChange
) {
}
