package com.finance.personalfinance.transaction.domain.repository;

import com.finance.personalfinance.category.domain.model.CategoryType;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionFilter(
        Long userId,
        CategoryType type,
        Long categoryId,
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal minAmount,
        BigDecimal maxAmount,
        String search,
        Long searchId
) {
}
